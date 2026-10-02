import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const MENU_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
export const MENU_MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;

export interface ParsedMenuEntry {
  week_number: number;
  day_of_week: typeof MENU_DAYS[number];
  meal_period: typeof MENU_MEALS[number];
  name: string;
  kcals: number;
  kitchen_choice: boolean;
}

type TextLine = { text: string; x: number; top: number; column: number };
type MealHeading = TextLine & { meal: typeof MENU_MEALS[number] };

const mealPattern: Record<string, typeof MENU_MEALS[number]> = {
  breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snacks: 'snacks', snack: 'snacks',
};

function toLines(items: any[], pageHeight: number): TextLine[] {
  const rows = new Map<number, any[]>();
  for (const item of items) {
    if (typeof item.str !== 'string' || !item.str.trim()) continue;
    const top = Math.round((pageHeight - item.transform[5]) * 2) / 2;
    rows.set(top, [...(rows.get(top) || []), item]);
  }

  const lines: TextLine[] = [];
  for (const [top, row] of rows) {
    for (const column of [0, 1]) {
      const cells = row.filter((item) => (item.transform[4] < 300 ? 0 : 1) === column)
        .sort((a, b) => a.transform[4] - b.transform[4]);
      if (!cells.length) continue;
      let text = '';
      let previous: any = null;
      for (const cell of cells) {
        const x = cell.transform[4];
        const digitRun = previous && /^\d+$/.test(previous.str) && /^\d+$/.test(cell.str);
        if (previous && !digitRun && x - (previous.transform[4] + previous.width) > 1.25) text += ' ';
        text += cell.str;
        previous = cell;
      }
      lines.push({ text: text.replace(/\s+/g, ' ').trim(), x: cells[0].transform[4], top, column });
    }
  }
  return lines.sort((a, b) => a.top - b.top || a.column - b.column);
}

export async function parseMonthlyMenuPdf(file: File): Promise<ParsedMenuEntry[]> {
  const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
  if (pdf.numPages !== 1 && pdf.numPages !== 4) {
    throw new Error('Use one seven-day menu page (repeated for the month) or four pages (one page per service week).');
  }

  const parsed: ParsedMenuEntry[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = toLines(content.items as any[], page.view[3]);
    const headings: MealHeading[] = lines.flatMap((line) => {
      const match = line.text.match(/(BREAKFAST|LUNCH|DINNER|SNACKS?)\s*:/i);
      if (!match) return [];
      return [{ ...line, column: line.column, meal: mealPattern[match[1].toLowerCase()] }];
    });
    const breakfasts = headings.filter((heading) => heading.meal === 'breakfast');
    if (breakfasts.length !== 6) {
      throw new Error(`Page ${pageNumber} has ${breakfasts.length} detected days; the THK menu must have six (Saturday–Thursday).`);
    }

    const seenDaysByColumn = new Map<number, number>();
    for (let dayIndex = 0; dayIndex < breakfasts.length; dayIndex += 1) {
      const breakfast = breakfasts[dayIndex];
      const position = seenDaysByColumn.get(breakfast.column) || 0;
      seenDaysByColumn.set(breakfast.column, position + 1);
      // The supplied THK PDF lays Saturday, Sunday, Wednesday and Thursday
      // in the right column; Monday and Tuesday are in the left column.
      const dayName = (breakfast.column === 0 ? ['Monday', 'Tuesday'] : ['Saturday', 'Sunday', 'Wednesday', 'Thursday'])[position];
      if (!dayName) throw new Error(`Page ${pageNumber} has an unexpected day column layout.`);
      const nextBreakfast = breakfasts.find((heading) => heading.meal === 'breakfast' && heading.column === breakfast.column && heading.top > breakfast.top);
      const dayHeadings = headings.filter((heading) => heading.column === breakfast.column && heading.top >= breakfast.top && (!nextBreakfast || heading.top < nextBreakfast.top));
      const orderedDayHeadings = dayHeadings.sort((a, b) => a.top - b.top);
      if (orderedDayHeadings.length !== 4 || MENU_MEALS.some((meal) => !orderedDayHeadings.some((heading) => heading.meal === meal))) {
        throw new Error(`Could not find all four meal sections for ${dayName} on PDF page ${pageNumber}.`);
      }

      for (let mealIndex = 0; mealIndex < orderedDayHeadings.length; mealIndex += 1) {
        const heading = orderedDayHeadings[mealIndex];
        const nextSection = orderedDayHeadings[mealIndex + 1] || nextBreakfast;
        const rowLines = lines.filter((line) => line.column === heading.column && line.top >= heading.top && (!nextSection || line.top < nextSection.top));
        const mealEntries: Omit<ParsedMenuEntry, 'kitchen_choice'>[] = [];
        for (const line of rowLines) {
          if (/\bESTD\s*2017\b/i.test(line.text)) continue;
          const withoutHeading = line.text.replace(/^.*?(?:BREAKFAST|LUNCH|DINNER|SNACKS?)\s*:\s*/i, '');
          const row = withoutHeading.match(/^(.+?)\s+(\d{2,4})\s*$/);
          if (!row) continue;
          const name = row[1].replace(/\bTRIANGLE\b/gi, '').replace(/\s+/g, ' ').trim();
          const kcals = Number(row[2]);
          if (!name || !Number.isInteger(kcals) || kcals < 20 || kcals > 2500) continue;
          mealEntries.push({ week_number: pdf.numPages === 1 ? 1 : pageNumber, day_of_week: dayName as ParsedMenuEntry['day_of_week'], meal_period: heading.meal, name, kcals });
        }
        const deduped = [...new Map(mealEntries.map((entry) => [`${entry.name.toLowerCase()}-${entry.kcals}`, entry])).values()];
        if (!deduped.length) throw new Error(`No dish and calorie rows were read for ${dayName} ${heading.meal}.`);
        deduped.forEach((entry, index) => parsed.push({ ...entry, kitchen_choice: index === 0 }));
      }
    }
  }
  return parsed;
}
