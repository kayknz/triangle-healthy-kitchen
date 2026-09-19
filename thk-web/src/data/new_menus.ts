import type { DailyMenu } from '../types/subscription';

export const MENU_A: DailyMenu[] = [
  {
    day: 'Saturday', short: 'Sat', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Grilled tuna avocado melt', name_ar: 'تونة مشوية وافوكادو ذايب', kcals: 203 },
        { name: 'Cheese & brocolli omelette', name_ar: 'أومليت الجبن والبروكلي', kcals: 186 },
        { name: 'Spanish omelette', name_ar: 'عجة اسبانيه', kcals: 160 },
        { name: 'Grilled halloumi & zaatar Croissant', name_ar: 'حلوم مشوي وكرواسون زعتر', kcals: 192 },
      ],
      lunch: [
        { name: 'Shawarma chicken with beetroot rice', name_ar: 'شاورما دجاج مع أرز الشمندر', kcals: 149 },
        { name: 'Shrimp biryani', name_ar: 'برياني روبيان', kcals: 163 },
        { name: 'Creamy beef & Mushroom pasta', name_ar: 'باستا باللحم البقري والفطر بالكريمة', kcals: 179 },
        { name: 'Chicken beetroot salad', name_ar: 'سلطة الشمندر بالدجاج', kcals: 127 },
      ],
      dinner: [
        { name: 'Tandoori chicken with couscous rice', name_ar: 'دجاج تندوري مع أرز الكسكس', kcals: 174 },
        { name: 'Saffron chicken risotto', name_ar: 'ريزوتو دجاج بالزعفران', kcals: 173 },
        { name: 'Swedish meat balls and mash potatoes', name_ar: 'كرات اللحم السويدية والبطاطس المهروسة', kcals: 180 },
        { name: 'Crunchy chicken tahini salad', name_ar: 'سلطة طحينة الدجاج المقرمشة', kcals: 148 },
      ],
      snacks: [
        { name: 'Saffron vermicelli pudding', name_ar: 'بودينغ الشعيرية بالزعفران', kcals: 244 },
        { name: 'Cream of broccoli soup', name_ar: 'شوربة كريمة البروكلي', kcals: 56 },
        { name: 'Keto cinnamon bombs', name_ar: 'قنابل القرفة كيتو', kcals: 245 },
        { name: 'Açai berry bowl', name_ar: 'وعاء توت الآساي', kcals: 220 },
      ],
    },
  },
  {
    day: 'Sunday', short: 'Sun', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'English breakfast', name_ar: 'إفطار إنجليزي', kcals: 163 },
        { name: 'Mushroom omelette with toast', name_ar: 'أومليت بالفطر مع الخبز المحمص', kcals: 180 },
        { name: 'Pesto chicken breakfast wrap', name_ar: 'راب إفطار دجاج بيستو', kcals: 207 },
        { name: 'Egg salad sandwich', name_ar: 'ساندويتش سلطة البيض', kcals: 212 },
      ],
      lunch: [
        { name: 'Chicken majboos with mint yoghurt', name_ar: 'مجبوس دجاج بالزبادي بالنعناع', kcals: 164 },
        { name: 'Beef steak with mash & grilled veggies', name_ar: 'شريحة لحم البقر مع الهريس والخضار المشوية', kcals: 197 },
        { name: 'Spaghetti Bolognese', name_ar: 'سباجيتي بولونيز', kcals: 178 },
        { name: 'Grilled chicken Greek salad', name_ar: 'سلطة الدجاج اليوناني المشوي', kcals: 118 },
      ],
      dinner: [
        { name: 'Chicken pesto fettuccine', name_ar: 'فيتوتشيني الدجاج بالبيستو', kcals: 184 },
        { name: 'Baked salmon with kidney bean rice', name_ar: 'سمك السلمون المخبوز مع أرز الفاصوليا', kcals: 163 },
        { name: 'Chipotle chicken burger', name_ar: 'برجر دجاج شيبوتل', kcals: 182 },
        { name: 'Spinach chicken salad', name_ar: 'سلطة الدجاج بالسبانخ', kcals: 134 },
      ],
      snacks: [
        { name: 'Rocca salad', name_ar: 'سلطة جرجير', kcals: 80 },
        { name: 'Chicken noodle soup', name_ar: 'حساء الدجاج بالشعيرية', kcals: 53 },
        { name: 'Raspberry Chia Pudding', name_ar: 'بودينج التوت الشيا', kcals: 110 },
        { name: 'Triangle fruit salad', name_ar: 'سلطة فواكه مثلثة', kcals: 94 },
      ],
    },
  },
  {
    day: 'Monday', short: 'Mon', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Cinnamon french toast', name_ar: 'توست فرنسي بالقرفة', kcals: 195 },
        { name: 'Smoked turkey & egg croissant', name_ar: 'ديك رومي مدخن وكرواسون البيض', kcals: 220 },
        { name: 'Oelette pizza', name_ar: 'بيتزا اومليت', kcals: 178 },
        { name: 'Tuna club sandwich', name_ar: 'ساندويتش كلوب تونة', kcals: 188 },
      ],
      lunch: [
        { name: 'Butter chicken with saffron rice', name_ar: 'دجاج بالزبدة مع أرز بالزعفران', kcals: 178 },
        { name: 'Grilled fish with lemon sauce & dill rice', name_ar: 'سمك مشوي مع صلصة الليمون والأرز بالشبت', kcals: 167 },
        { name: 'Chicken mushroom stroganoff & rice', name_ar: 'دجاج مشروم ستروجانوف و أرز', kcals: 175 },
        { name: 'Chickpea, chicken & basil salad', name_ar: 'سلطة الحمص والدجاج والريحان', kcals: 157 },
      ],
      dinner: [
        { name: 'Caramelized onion beef burger', name_ar: 'برجر لحم بقري بالبصل المكرمل', kcals: 205 },
        { name: 'Pomegranate chicken wrap', name_ar: 'راب دجاج بالرمان', kcals: 196 },
        { name: 'Chicken chow mein', name_ar: 'تشاو مين الدجاج', kcals: 180 },
        { name: 'Chicken Cesar salad', name_ar: 'سلطة سيزر بالدجاج', kcals: 153 },
      ],
      snacks: [
        { name: 'Orange salad', name_ar: 'سلطة البرتقال', kcals: 78 },
        { name: 'Lentil soup', name_ar: 'حساء العدس', kcals: 65 },
        { name: 'Banana Oatmeal', name_ar: 'دقيق الشوفان بالموز', kcals: 202 },
        { name: 'Baked musakhan rolls', name_ar: 'مسخن رول', kcals: 188 },
      ],
    },
  },
  {
    day: 'Tuesday', short: 'Tue', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Falafel wrap', name_ar: 'لفة فلافل', kcals: 160 },
        { name: 'Pepperoni egg and cheese sandwich', name_ar: 'ساندوتش بيبروني بيض وجبنة', kcals: 186 },
        { name: 'Cheese eggs and bacon sandwich', name_ar: 'بيض بالجبن وساندويتش لحم بقري مقدد', kcals: 180 },
        { name: 'Healthy Shawarma wrap', name_ar: 'لفة شاورما صحية', kcals: 193 },
      ],
      lunch: [
        { name: 'Dynamite chicken & sweet potato mash', name_ar: 'ديناميت الدجاج والبطاطا المهروسة', kcals: 185 },
        { name: 'Chicken Rose pasta', name_ar: 'باستا دجاج روز', kcals: 163 },
        { name: 'Beef bamia with vermicelli rice', name_ar: 'لحم بامية مع أرز بالشعيرية', kcals: 170 },
        { name: 'Honey mustard Chicken Salad', name_ar: 'سلطة الدجاج بالخردل والعسل', kcals: 168 },
      ],
      dinner: [
        { name: 'Spinach chicken risotto', name_ar: 'ريزوتو دجاج بالسبانخ', kcals: 183 },
        { name: 'Fajita chicken with roasted cauliflower', name_ar: 'فاهيتا دجاج مع قرنبيط مشوي', kcals: 175 },
        { name: 'Chilli tuna ciabatta', name_ar: 'تونة بالفلفل الحار سياباتا ساندويتش', kcals: 183 },
        { name: 'Mexican chicken salad', name_ar: 'سلطة الدجاج المكسيكية', kcals: 112 },
      ],
      snacks: [
        { name: 'Honey cake', name_ar: 'كعكة العسل', kcals: 238 },
        { name: 'Chia fruit salad', name_ar: 'سلطة فواكه الشيا', kcals: 105 },
        { name: 'Pumpkin soup', name_ar: 'حساء اليقطين', kcals: 70 },
        { name: 'Cinnamon Apple Yogurt', name_ar: 'زبادي التفاح بالقرفة', kcals: 180 },
      ],
    },
  },
  {
    day: 'Wednesday', short: 'Wed', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Smoked turkey wrap', name_ar: 'راب الديك الرومي المدخن', kcals: 190 },
        { name: 'Truffled scrambled egg', name_ar: 'بيضة مخفوقة بالترفل', kcals: 193 },
        { name: 'Roasted pumpkin egg sandwich', name_ar: 'ساندويتش بيض اليقطين المحمص', kcals: 164 },
        { name: 'French toast with berries & syrup', name_ar: 'توست فرنسي مع التوت والشراب', kcals: 204 },
      ],
      lunch: [
        { name: 'Mushroom chicken and baked potatoes', name_ar: 'دجاج بالفطر والبطاطا المخبوزة', kcals: 183 },
        { name: 'Chicken quesadilla', name_ar: 'كاساديا دجاج', kcals: 178 },
        { name: 'Meat shawarma & sweet potato fries', name_ar: 'شاورما لحم وبطاطا مقلية', kcals: 183 },
        { name: 'Chicken Cucumber & Tomato Salad', name_ar: 'سلطة الدجاج بالخيار والطماطم', kcals: 97 },
      ],
      dinner: [
        { name: 'Chicken Club sandwich', name_ar: 'ساندوتش كلوب دجاج', kcals: 170 },
        { name: 'Healthy beef tacos', name_ar: 'تاكو لحم البقر الصحي', kcals: 172 },
        { name: 'Spicy Shrimp spaghetti', name_ar: 'سباغيتي الروبيان الحار', kcals: 182 },
        { name: 'Chicken tawook fattoush salad', name_ar: 'سلطة فتوش طاووق دجاج', kcals: 113 },
      ],
      snacks: [
        { name: 'Tuna salad', name_ar: 'سلطة التونة', kcals: 120 },
        { name: 'New York style cheesecake', name_ar: 'تشيز كيك على طريقة نيويورك', kcals: 321 },
        { name: 'Oats and berries', name_ar: 'الشوفان والتوت', kcals: 102 },
        { name: 'Clear veggie soup', name_ar: 'حساء الخضار الشفاف', kcals: 32 },
      ],
    },
  },
  {
    day: 'Thursday', short: 'Thu', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Healthy sunny side up eggs', name_ar: 'بيض مشمس صحي', kcals: 128 },
        { name: 'Mushroom egg & cheese sandwich', name_ar: 'ساندويتش البيض والفطر والجبن', kcals: 180 },
        { name: 'Chicken salad sandwich', name_ar: 'ساندويتش سلطة الدجاج', kcals: 170 },
        { name: 'Cinnamon banana pancakes', name_ar: 'فطائر الموز بالقرفة', kcals: 189 },
      ],
      lunch: [
        { name: 'Chicken bukhari rice & mint yoghurt', name_ar: 'أرز بخاري بالدجاج و الزبادي بالنعناع', kcals: 166 },
        { name: 'Pan-Seared Sea Bass with yellow rice', name_ar: 'سمك القاروص المقلي مع الأرز الأصفر', kcals: 187 },
        { name: 'Armenian grilled chicken', name_ar: 'دجاج أرمني مشوي', kcals: 172 },
        { name: 'Rocca salad with shredded beef', name_ar: 'سلطة جرجير مع لحم البقر المبشور', kcals: 92 },
      ],
      dinner: [
        { name: 'Creamy chicken penne pasta', name_ar: 'باستا بيني بالدجاج بالكريمة', kcals: 164 },
        { name: 'Buffalo chicken burger & sweet fries', name_ar: 'برجر دجاج بافلو مع بطاطا حلوة', kcals: 204 },
        { name: 'Shish Tawook with couscous rice', name_ar: 'شيش طاووق مع أرز الكسكس', kcals: 160 },
        { name: 'Grilled Teriyaki Chicken Salad', name_ar: 'سلطة دجاج ترياكي مشوي', kcals: 108 },
      ],
      snacks: [
        { name: 'Rice pudding', name_ar: 'بودنغ الأرز', kcals: 260 },
        { name: 'Stuffed grape leaves', name_ar: 'ورق عنب محشي', kcals: 92 },
        { name: 'Peanut butter oats', name_ar: 'الشوفان بزبدة الفول السوداني', kcals: 236 },
        { name: 'Mixed fruit granola bowl', name_ar: 'وعاء جرانولا فواكه مشكلة', kcals: 136 },
      ],
    },
  },
];

export const MENU_C: DailyMenu[] = [
  {
    day: 'Saturday', short: 'Sat', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Muhammara Chicken Sandwich', kcals: 170 },
        { name: 'Cheese & brocolli omelette', kcals: 186 },
        { name: 'Grilled halloumi sandwich', kcals: 180 },
        { name: 'Sweet potato pancakes', kcals: 164 },
      ],
      lunch: [
        { name: 'Spinach chicken risotto', kcals: 183 },
        { name: 'Creamy meatballs with dill rice', kcals: 180 },
        { name: 'Butter chicken with saffron rice', kcals: 178 },
        { name: 'Chicken beetroot salad', kcals: 127 },
      ],
      dinner: [
        { name: 'Chicken & smoked turkey sandwich', kcals: 174 },
        { name: 'Spicy shrimp rose pasta', kcals: 185 },
        { name: 'Healthy beef tacos', kcals: 172 },
        { name: 'Crunchy chicken tahini salad', kcals: 148 },
      ],
      snacks: [
        { name: 'Saffron vermicelli pudding', kcals: 244 },
        { name: 'Carrot and celery soup', kcals: 75 },
        { name: 'Dark chocolate granola bars', kcals: 280 },
        { name: 'Açai berry bowl', kcals: 220 },
      ],
    },
  },
  {
    day: 'Sunday', short: 'Sun', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Scrambled eggs and grilled halloumi', kcals: 155 },
        { name: 'Cheese eggs and bacon sandwich', kcals: 180 },
        { name: 'Pesto chicken breakfast wrap', kcals: 207 },
        { name: 'Oatmeal pancakes', kcals: 186 },
      ],
      lunch: [
        { name: 'Chicken majboos with mint yoghurt', kcals: 164 },
        { name: 'Teriyaki salmon rice bowl', kcals: 170 },
        { name: 'Stuffed Chicken Breast with white rice', kcals: 158 },
        { name: 'Grilled chicken Greek salad', kcals: 118 },
      ],
      dinner: [
        { name: 'Chicken pesto fettuccine', kcals: 184 },
        { name: 'Kimchi beef burger', kcals: 190 },
        { name: 'Fajita chicken with roasted cauliflower', kcals: 178 },
        { name: 'Buffalo chicken salad', kcals: 130 },
      ],
      snacks: [
        { name: 'Energy date balls', kcals: 168 },
        { name: 'Healthy chicken & broccoli soup', kcals: 58 },
        { name: 'Raspberry Chia Pudding', kcals: 110 },
        { name: 'Triangle fruit salad', kcals: 94 },
      ],
    },
  },
  {
    day: 'Monday', short: 'Mon', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Cinnamon french toast', kcals: 195 },
        { name: 'Smoked turkey & egg croissant', kcals: 220 },
        { name: 'Tofu sandwich', kcals: 155 },
        { name: 'Tuna club sandwich', kcals: 188 },
      ],
      lunch: [
        { name: 'Mushroom chicken and baked potatoes', kcals: 183 },
        { name: 'Thai shrimp curry with rice', kcals: 160 },
        { name: 'Chicken Biryani', kcals: 162 },
        { name: 'Quinoa & lentil salad with grilled shrimp', kcals: 130 },
      ],
      dinner: [
        { name: 'Chicken and Mushroom Risotto', kcals: 184 },
        { name: 'Spaghetti Bolognese', kcals: 178 },
        { name: 'Pomegranate chicken wrap', kcals: 196 },
        { name: 'Beetroot Goat cheese chicken salad', kcals: 163 },
      ],
      snacks: [
        { name: 'Orange salad', kcals: 78 },
        { name: 'Lentil soup', kcals: 65 },
        { name: 'Banana Oatmeal', kcals: 202 },
        { name: 'Matcha granola bowl', kcals: 188 },
      ],
    },
  },
  {
    day: 'Tuesday', short: 'Tue', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Eggplant fatteh', kcals: 124 },
        { name: 'Pepperoni egg and cheese sandwich', kcals: 186 },
        { name: 'Shakshouka croissant', kcals: 160 },
        { name: 'Healthy Shawarma wrap', kcals: 193 },
      ],
      lunch: [
        { name: 'Peri peri chicken and rice', kcals: 185 },
        { name: 'Beef bamia with vermicelli rice', kcals: 170 },
        { name: 'Tandoori chicken with couscous rice', kcals: 174 },
        { name: 'Honey mustard Chicken Salad', kcals: 168 },
      ],
      dinner: [
        { name: 'Cajun chicken pasta', kcals: 160 },
        { name: 'Tom Yum soup with sticky rice', kcals: 140 },
        { name: 'Crunchy chicken burger', kcals: 183 },
        { name: 'Arabian salad with grilled chicken', kcals: 112 },
      ],
      snacks: [
        { name: 'Honey cake', kcals: 238 },
        { name: 'Sunflower seed energy bites', kcals: 380 },
        { name: 'Cinnamon Apple Yogurt', kcals: 180 },
        { name: 'Baked musakhan rolls', kcals: 188 },
      ],
    },
  },
  {
    day: 'Wednesday', short: 'Wed', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Smoked turkey wrap', kcals: 190 },
        { name: 'Zatar omelet', kcals: 154 },
        { name: 'Roasted pumpkin egg Sandwich', kcals: 164 },
        { name: 'French toast with berries & syrup', kcals: 204 },
      ],
      lunch: [
        { name: 'Tenderloin steak with mashed potatoes', kcals: 197 },
        { name: 'Grilled fish with lemon butter & dill rice', kcals: 167 },
        { name: 'Cajun chicken with mango salsa', kcals: 165 },
        { name: 'Subway chicken salad', kcals: 140 },
      ],
      dinner: [
        { name: 'Chicken Club sandwich', kcals: 170 },
        { name: 'Bacon & cheese beef burger', kcals: 195 },
        { name: 'Creamy Tuscan chicken and rice', kcals: 182 },
        { name: 'Chicken tawook fattoush salad', kcals: 113 },
      ],
      snacks: [
        { name: 'Chicken spring rolls', kcals: 101 },
        { name: 'Apple raisin oat bar', kcals: 250 },
        { name: 'Oats and berries', kcals: 180 },
        { name: 'Cream of mushroom soup', kcals: 90 },
      ],
    },
  },
  {
    day: 'Thursday', short: 'Thu', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Avocado egg sandwich', kcals: 184 },
        { name: 'Nori egg rolls', kcals: 180 },
        { name: 'Chicken salad sandwich', kcals: 170 },
        { name: 'Cinnamon banana pancakes', kcals: 189 },
      ],
      lunch: [
        { name: 'Chicken bukhari rice & mint yoghurt', kcals: 166 },
        { name: 'Meat shawarma & sweet potato fries', kcals: 183 },
        { name: 'Chicken mashkhool', kcals: 173 },
        { name: 'Rocca salad with shredded beef', kcals: 92 },
      ],
      dinner: [
        { name: 'Creamy spinach chicken pasta', kcals: 164 },
        { name: 'Shrimp biryani', kcals: 195 },
        { name: 'Shish Tawook with couscous rice', kcals: 160 },
        { name: 'Grilled Teriyaki Chicken Salad', kcals: 108 },
      ],
      snacks: [
        { name: 'Rice pudding', kcals: 112 },
        { name: 'Stuffed grape leaves', kcals: 92 },
        { name: 'Peanut butter oats', kcals: 236 },
        { name: 'Umm ali', kcals: 238 },
      ],
    },
  },
];

export const MENU_D: DailyMenu[] = [
  {
    day: 'Saturday', short: 'Sat', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Chicken salad croissant sandwich', kcals: 220 },
        { name: 'Mushroom egg and cheese sandwich', kcals: 180 },
        { name: 'Grilled halloumi sandwich', kcals: 180 },
        { name: 'Healthy berry pancakes', kcals: 185 },
      ],
      lunch: [
        { name: 'Stuffed Chicken Breast with white rice', kcals: 153 },
        { name: 'Creamy beef & mushroom pasta', kcals: 179 },
        { name: 'Butter chicken with saffron rice', kcals: 178 },
        { name: 'Chicken beetroot salad', kcals: 127 },
      ],
      dinner: [
        { name: 'Chicken BLT sandwich', kcals: 200 },
        { name: 'Spicy shrimp rose pasta', kcals: 185 },
        { name: 'Tandoori chicken with couscous rice', kcals: 174 },
        { name: 'Crunchy chicken tahini salad', kcals: 148 },
      ],
      snacks: [
        { name: 'Chocolate dipped date', kcals: 244 },
        { name: 'Carrot and celery soup', kcals: 75 },
        { name: 'Green salad', kcals: 280 },
        { name: 'Overnight oats', kcals: 202 },
      ],
    },
  },
  {
    day: 'Sunday', short: 'Sun', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Cheese & brocolli omelette', kcals: 186 },
        { name: 'Cheese eggs and bacon sandwich', kcals: 180 },
        { name: 'Pesto chicken breakfast wrap', kcals: 207 },
        { name: 'Peanut butter oats', kcals: 236 },
      ],
      lunch: [
        { name: 'Teriyaki chicken rice bowl', kcals: 170 },
        { name: 'Fish majboos & mint yoghurt', kcals: 164 },
        { name: 'Truffle shrimp Risotto', kcals: 183 },
        { name: 'Grilled chicken Greek salad', kcals: 118 },
      ],
      dinner: [
        { name: 'Chicken pesto fettuccine', kcals: 184 },
        { name: 'Classic beef burger', kcals: 190 },
        { name: 'Chicken fajita & roasted cauliflower', kcals: 178 },
        { name: 'Buffalo chicken salad', kcals: 130 },
      ],
      snacks: [
        { name: 'Chicken Stuffed zucchini\'s', kcals: 168 },
        { name: 'Healthy chicken & broccoli soup', kcals: 58 },
        { name: 'Raspberry Chia Pudding', kcals: 110 },
        { name: 'Triangle fruit salad', kcals: 94 },
      ],
    },
  },
  {
    day: 'Monday', short: 'Mon', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Cinnamon french toast', kcals: 195 },
        { name: 'Smoked turkey & egg croissant', kcals: 220 },
        { name: 'Egg salad sandwich', kcals: 212 },
        { name: 'Tuna avocado sandwich with capers', kcals: 203 },
      ],
      lunch: [
        { name: 'Chicken pizzaiola with white', kcals: 170 },
        { name: 'Thai shrimp curry with rice', kcals: 160 },
        { name: 'Chicken Biryani', kcals: 162 },
        { name: 'Quinoa & lentil salad with grilled shrimp', kcals: 130 },
      ],
      dinner: [
        { name: 'Chicken and mushroom Risotto', kcals: 184 },
        { name: 'Spaghetti Bolognese', kcals: 178 },
        { name: 'Pomegranate chicken wrap', kcals: 196 },
        { name: 'Beetroot Goat cheese chicken salad', kcals: 163 },
      ],
      snacks: [
        { name: 'Fennel soup', kcals: 78 },
        { name: 'Chocolate cashew bites', kcals: 65 },
        { name: 'Banana Oatmeal', kcals: 202 },
        { name: 'mixed fruit granola bowl', kcals: 188 },
      ],
    },
  },
  {
    day: 'Tuesday', short: 'Tue', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Eggplant fatteh', kcals: 124 },
        { name: 'Pepperoni egg and cheese sandwich', kcals: 186 },
        { name: 'Healthy sunny side up eggs', kcals: 128 },
        { name: 'Healthy Shawarma wrap', kcals: 193 },
      ],
      lunch: [
        { name: 'Peri peri chicken and rice', kcals: 178 },
        { name: 'Pesto shell pasta with grilled shrimps', kcals: 184 },
        { name: 'Chicken katsu curry with white rice', kcals: 165 },
        { name: 'Honey mustard Chicken Salad', kcals: 168 },
      ],
      dinner: [
        { name: 'Chicken quesadilla', kcals: 160 },
        { name: 'Meat shawarma plate', kcals: 183 },
        { name: 'Crunchy Chicken burger', kcals: 183 },
        { name: 'Arabian salad with grilled chicken', kcals: 112 },
      ],
      snacks: [
        { name: 'Tiramisu cake', kcals: 380 },
        { name: 'Potato leek soup', kcals: 90 },
        { name: 'Cinnamon Apple Yogurt', kcals: 180 },
        { name: 'Baked musakhan rolls', kcals: 188 },
      ],
    },
  },
  {
    day: 'Wednesday', short: 'Wed', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Mexican eggs fritatta', kcals: 160 },
        { name: 'Zatar omelet', kcals: 154 },
        { name: 'Roasted pumpkin egg Sandwich', kcals: 164 },
        { name: 'French toast with berries & syrup', kcals: 204 },
      ],
      lunch: [
        { name: 'Garlic Parmesan Chicken Spaghetti', kcals: 182 },
        { name: 'Grilled fish with dill rice', kcals: 167 },
        { name: 'Chicken mashkhool', kcals: 173 },
        { name: 'Subway chicken salad', kcals: 140 },
      ],
      dinner: [
        { name: 'Chicken Club sandwich', kcals: 170 },
        { name: 'Pomegranate beef burger', kcals: 190 },
        { name: 'Tenderloin steak with mashed potatoes', kcals: 197 },
        { name: 'Chicken tawook fattoush salad', kcals: 113 },
      ],
      snacks: [
        { name: 'Lazy cake bar', kcals: 260 },
        { name: 'Watermelon feta salad', kcals: 120 },
        { name: 'Oats and berries', kcals: 180 },
        { name: 'Cream of mushroom soup', kcals: 90 },
      ],
    },
  },
  {
    day: 'Thursday', short: 'Thu', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Egg N\' HashBrown wrap', kcals: 210 },
        { name: 'Grilled halloumi zaatar croissant', kcals: 192 },
        { name: 'Chicken salad sandwich', kcals: 170 },
        { name: 'Cinnamon banana pancakes', kcals: 189 },
      ],
      lunch: [
        { name: 'Chicken bukhari rice & mint yoghurt', kcals: 166 },
        { name: 'Shrimp biryani', kcals: 195 },
        { name: 'Shish Tawook with couscous rice', kcals: 160 },
        { name: 'Chicken Caesar salad', kcals: 153 },
      ],
      dinner: [
        { name: 'Creamy spinach chicken pasta', kcals: 164 },
        { name: 'Healthy beef tacos', kcals: 172 },
        { name: 'Grilled chicken with mango salsa', kcals: 165 },
        { name: 'Grilled Teriyaki Chicken Salad', kcals: 108 },
      ],
      snacks: [
        { name: 'Pistachio Bon Bon', kcals: 380 },
        { name: 'Stuffed grape leaves', kcals: 112 },
        { name: 'Rocco salad', kcals: 92 },
        { name: 'New York style cheesecake', kcals: 236 },
      ],
    },
  },
];

export const MENU_E: DailyMenu[] = [
  {
    day: 'Saturday', short: 'Sat', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Eggs benedict with spinach', name_ar: 'بيض بينيديكت مع سبانخ', kcals: 175 },
        { name: 'Muhammara chicken sandwich', name_ar: 'ساندويتش دجاج محمرة', kcals: 170 },
        { name: 'Mix berry croissant', name_ar: 'كروسان ميكس توت', kcals: 230 },
        { name: 'Egg salad sandwich', name_ar: 'ساندويتش سلطة بيض', kcals: 212 },
      ],
      lunch: [
        { name: 'Steakhouse penne pasta', name_ar: 'معكرونة بيني ستيك هاوس', kcals: 185 },
        { name: 'Spicy coriander chicken with rice', name_ar: 'دجاج كزبرة حار مع أرز', kcals: 167 },
        { name: 'Shish Tawook with couscous rice', name_ar: 'شيش طاووق مع أرز بالكسكس', kcals: 160 },
        { name: 'Mediterranean chicken salad', name_ar: 'سلطة دجاج متوسطية', kcals: 133 },
      ],
      dinner: [
        { name: 'Chicken Club sandwich', name_ar: 'ساندويتش كلوب دجاج', kcals: 170 },
        { name: 'Thai shrimp curry with rice', name_ar: 'كاري روبيان تايلاندي مع أرز', kcals: 160 },
        { name: 'Spinach chicken risotto', name_ar: 'ريزوتو دجاج بالسبانخ', kcals: 183 },
        { name: 'Harak osbao', name_ar: 'حرّاق أصبعه', kcals: 170 },
      ],
      snacks: [
        { name: 'Triangle fruit salad', name_ar: 'سلطة فواكه مثلثة', kcals: 94 },
        { name: 'Chicken Stuffed zucchini\'s', name_ar: 'كوسا محشية بالدجاج', kcals: 110 },
        { name: 'Celery & carrot soup', name_ar: 'حساء الكرفس والجزر', kcals: 75 },
        { name: 'Green salad', name_ar: 'سلطة خضراء', kcals: 60 },
      ],
    },
  },
  {
    day: 'Sunday', short: 'Sun', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Peanut butter oats', name_ar: 'شوفان زبدة الفول السوداني', kcals: 236 },
        { name: 'Spinach, mushrooms & cheese omelette', name_ar: 'عجة سبانخ، مشروم وجبنة', kcals: 187 },
        { name: 'Eggplant fatteh', name_ar: 'فتة باذنجان', kcals: 124 },
        { name: 'Avocado egg croissant & Tomato Jam', name_ar: 'كروسان بيض بالأفوكادو ومربى طماطم', kcals: 235 },
      ],
      lunch: [
        { name: 'Mongolian beef rice bowl', name_ar: 'طبق أرز باللحم البقري المنغولي', kcals: 168 },
        { name: 'Chipotle chicken burger', name_ar: 'برجر دجاج شيبوتلي', kcals: 182 },
        { name: 'Chicken pesto fettuccine', name_ar: 'فيتوتشيني دجاج بالبيستو', kcals: 184 },
        { name: 'Grilled chicken Greek salad', name_ar: 'سلطة يونانية بالدجاج المشوي', kcals: 118 },
      ],
      dinner: [
        { name: 'Salmon sayadieh', name_ar: 'صيادية سلمون', kcals: 170 },
        { name: 'Chicken Moulkhiya with white Rice', name_ar: 'ملوخية دجاج مع أرز أبيض', kcals: 120 },
        { name: 'Chicken Penne Arrabbiata', name_ar: 'بيني أرابياتا دجاج', kcals: 160 },
        { name: 'Honey Mustard Chicken Salad', name_ar: 'سلطة دجاج بالخردل والعسل', kcals: 168 },
      ],
      snacks: [
        { name: 'Lime & pistachio energy balls', name_ar: 'كرات طاقة بالليمون والفستق', kcals: 320 },
        { name: 'Chicken & corn soup', name_ar: 'شوربة دجاج وذرة', kcals: 72 },
        { name: 'Talbina', name_ar: 'تلبينة', kcals: 130 },
        { name: 'Date stuffed roll', name_ar: 'لفائف محشوة بالتمر', kcals: 300 },
      ],
    },
  },
  {
    day: 'Monday', short: 'Mon', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Cinnamon french toast', name_ar: 'خبز فرنسي محمص بالقرفة', kcals: 195 },
        { name: 'Egg & Turkey protein burrito', name_ar: 'بوريتو بروتين بالبيض والديك الرومي', kcals: 180 },
        { name: 'Tuna club sandwich', name_ar: 'ساندويتش كلوب بالتونة', kcals: 188 },
        { name: 'Shakshouka with pita bread', name_ar: 'شكشوكة مع خبز بيتا', kcals: 131 },
      ],
      lunch: [
        { name: 'Butter chicken with saffron rice', name_ar: 'دجاج بالزبدة مع أرز بالزعفران', kcals: 178 },
        { name: 'Creamy Chicken Orzo', name_ar: 'أورزو دجاج بالكريمة', kcals: 180 },
        { name: 'Kimchi beef burger', name_ar: 'برجر لحم بقري بالكيمتشي', kcals: 190 },
        { name: 'Beetroot Goat cheese chicken salad', name_ar: 'سلطة دجاج بالشمندر وجبن الماعز', kcals: 163 },
      ],
      dinner: [
        { name: 'Chicken and mushroom risotto', name_ar: 'ريزوتو دجاج وفطر', kcals: 184 },
        { name: 'Tandoori chicken with couscous rice', name_ar: 'دجاج تندوري مع أرز بالكسكس', kcals: 172 },
        { name: 'Sweet potato burger bowl', name_ar: 'وعاء برجر البطاطا الحلوة', kcals: 187 },
        { name: 'Crunchy chicken tahini salad', name_ar: 'سلطة دجاج مقرمشة بالطحينة', kcals: 148 },
      ],
      snacks: [
        { name: 'Orange salad', name_ar: 'سلطة برتقال', kcals: 78 },
        { name: 'Chicken & broccoli soup', name_ar: 'حساء دجاج وبروكلي', kcals: 58 },
        { name: 'Chocolate cashew bites', name_ar: 'قطع كاجو بالشوكولاتة', kcals: 400 },
        { name: 'Mixed fruit granola bowl', name_ar: 'طبق جرانولا بالفواكه المشكلة', kcals: 136 },
      ],
    },
  },
  {
    day: 'Tuesday', short: 'Tue', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Falafel eggplant wrap', name_ar: 'لفائف الباذنجان والفلافل', kcals: 208 },
        { name: 'Orange French toast', name_ar: 'خبز فرنسي محمص بالبرتقال', kcals: 229 },
        { name: 'Cheese eggs and bacon sandwich', name_ar: 'ساندويتش بيض وجبن مع لحم مقدد', kcals: 180 },
        { name: 'Healthy Shawarma wrap', name_ar: 'لفائف شاورما صحية', kcals: 193 },
      ],
      lunch: [
        { name: 'Chicken katsu curry with white rice', name_ar: 'كاري دجاج كاتسو مع أرز أبيض', kcals: 165 },
        { name: 'Roast pumpkin chicken pasta', name_ar: 'مكرونة دجاج بالقرع المشوي', kcals: 152 },
        { name: 'Beef steak with mash & grilled veggies', name_ar: 'ستيك مع بطاطس مهروسة وخضار مشوية', kcals: 197 },
        { name: 'Spinach chicken salad', name_ar: 'سلطة دجاج بالسبانخ', kcals: 134 },
      ],
      dinner: [
        { name: 'Bang bang chicken & coconut rice bowl', name_ar: 'وعاء أرز بانج بانج بالدجاج وجوز الهند', kcals: 175 },
        { name: 'Shrimp chow mein', name_ar: 'تشاو مين بالروبيان', kcals: 172 },
        { name: 'Chicken burrito bowl', name_ar: 'وعاء بوريتو بالدجاج', kcals: 180 },
        { name: 'Chicken Cobb salad', name_ar: 'سلطة دجاج كوب', kcals: 160 },
      ],
      snacks: [
        { name: 'Lazy cake bar', name_ar: 'بار الكيك الكسول', kcals: 260 },
        { name: 'Chia fruit salad', name_ar: 'سلطة فواكه ببذور الشيا', kcals: 105 },
        { name: 'Pumpkin soup', name_ar: 'حساء اليقطين', kcals: 70 },
        { name: 'Cinnamon Apple Yogurt', name_ar: 'زبادي التفاح والقرفة', kcals: 180 },
      ],
    },
  },
  {
    day: 'Wednesday', short: 'Wed', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Smoked turkey wrap', name_ar: 'لفائف ديك رومي مدخن', kcals: 190 },
        { name: 'Cinnamon banana pancakes', name_ar: 'فطائر الموز بالقرفة', kcals: 189 },
        { name: 'Eggs & Velvet hummus Sandwich', name_ar: 'ساندويتش بيض وحمص مخملي', kcals: 177 },
        { name: 'Mushroom egg & cheese sandwich', name_ar: 'ساندويتش بيض وجبن بالفطر', kcals: 180 },
      ],
      lunch: [
        { name: 'koshary with crispy beef bacon', name_ar: 'كشري مع لحم بقري مقدد مقرمش', kcals: 160 },
        { name: 'Chicken quesadilla', name_ar: 'كاساديا دجاج', kcals: 178 },
        { name: 'Healthy Shrimp mmawash', name_ar: 'ماموش روبيان صحي', kcals: 145 },
        { name: 'Triangle tuna salad', name_ar: 'سلطة تونة مثلثة', kcals: 160 },
      ],
      dinner: [
        { name: 'Bukhari rice with chicken', name_ar: 'أرز بخاري مع دجاج', kcals: 166 },
        { name: 'Bacon and cheese beef burger', name_ar: 'برجر لحم بقري مع لحم مقدد وجبن', kcals: 195 },
        { name: 'Spicy pink sauce shrimp pasta', name_ar: 'معكرونة روبيان بصلصة وردية حارة', kcals: 170 },
        { name: 'Grilled corn and chicken salad', name_ar: 'سلطة ذرة مشوية ودجاج', kcals: 130 },
      ],
      snacks: [
        { name: 'Clear veggie soup', name_ar: 'شوربة خضار صافية', kcals: 32 },
        { name: 'New York style cheesecake', name_ar: 'تشيز كيك على طريقة نيويورك', kcals: 321 },
        { name: 'Oats and berries', name_ar: 'شوفان وتوت', kcals: 102 },
        { name: 'Protein chocolate pudding', name_ar: 'بودنغ شوكولاتة غني بالبروتين', kcals: 140 },
      ],
    },
  },
  {
    day: 'Thursday', short: 'Thu', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Pepperoni egg and cheese sandwich', name_ar: 'ساندويتش بيبروني بالبيض والجبن', kcals: 186 },
        { name: 'French toast with berries & syrup', name_ar: 'خبز فرنسي محمص مع التوت والشراب', kcals: 204 },
        { name: 'Chicken salad sandwich', name_ar: 'ساندويتش سلطة دجاج', kcals: 170 },
        { name: 'Carrots & banana Pancakes', name_ar: 'فطائر جزر وموز', kcals: 160 },
      ],
      lunch: [
        { name: 'Teriyaki salmon rice bowl', name_ar: 'وعاء أرز ترياكي بالسلمون', kcals: 170 },
        { name: 'Spaghetti and meatballs', name_ar: 'سباجيتي مع كرات لحم', kcals: 170 },
        { name: 'Stuffed Chicken Breast with white rice', name_ar: 'صدر دجاج محشو بالأرز الأبيض', kcals: 153 },
        { name: 'Watermelon & Feta Chicken Salad', name_ar: 'سلطة دجاج بالبطيخ والفيتا', kcals: 100 },
      ],
      dinner: [
        { name: 'Thai Green Chicken Curry with rice', name_ar: 'كاري دجاج أخضر تايلاندي مع أرز', kcals: 165 },
        { name: 'Pesto shell pasta with grilled shrimps', name_ar: 'معكرونة بقشرة البيستو مع روبيان مشوي', kcals: 184 },
        { name: 'Caesar chicken wrap & roasted potatoes', name_ar: 'راب دجاج سيزر مع بطاطس مشوية', kcals: 177 },
        { name: 'Grilled Teriyaki Chicken Salad', name_ar: 'سلطة دجاج ترياكي مشوي', kcals: 108 },
      ],
      snacks: [
        { name: 'Tuna salad', name_ar: 'سلطة تونة', kcals: 140 },
        { name: 'Cream of mushroom soup', name_ar: 'حساء كريمة الفطر', kcals: 70 },
        { name: 'Dark chocolate granola bar', name_ar: 'شريط جرانولا بالشوكولاتة الداكنة', kcals: 280 },
        { name: 'Coconut energy balls', name_ar: 'كرات جوز الهند المغذية', kcals: 280 },
      ],
    },
  },
];

export const MENU_F: DailyMenu[] = [
  {
    day: 'Saturday', short: 'Sat', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Eggs & velvet hummus Sandwich', name_ar: 'ساندوتش بيض وحمص مخملي', kcals: 177 },
        { name: 'Turkish eggs', name_ar: 'بيض تركي', kcals: 171 },
        { name: 'Chicken salad sandwich with chives', name_ar: 'ساندوتش سلطة دجاج مع بصل أخضر', kcals: 170 },
        { name: 'Grilled halloumi & zaatar Croissant', name_ar: 'كرواسون حلومي مشوي مع زعتر', kcals: 192 },
      ],
      lunch: [
        { name: 'Chicken and mushroom risotto', name_ar: 'ريزوتو دجاج وفطر', kcals: 184 },
        { name: 'Thai shrimp curry with rice', name_ar: 'كاري روبيان تايلاندي مع أرز', kcals: 160 },
        { name: 'Grilled chicken with pomegranate rice', name_ar: 'دجاج مشوي مع أرز بالرمان', kcals: 183 },
        { name: 'Quinoa & berry Chicken Salad', name_ar: 'سلطة دجاج بالكينوا والتوت', kcals: 135 },
      ],
      dinner: [
        { name: 'Creamy mushroom chicken Pasta', name_ar: 'معكرونة دجاج بالفطر الكريمي', kcals: 170 },
        { name: 'Pulled beef quesadilla', name_ar: 'كاساديا لحم بقري مسحب', kcals: 195 },
        { name: 'Chimichurri Chicken & Roasted Potatoes', name_ar: 'دجاج تشيميتشوري مع بطاطا مشوية', kcals: 180 },
        { name: 'Chickpea avocado chicken salad', name_ar: 'سلطة دجاج بالحمص والأفوكادو', kcals: 168 },
      ],
      snacks: [
        { name: 'Gil-E-Firdaus pudding', name_ar: 'بودينغ جيل إي فردوس', kcals: 165 },
        { name: 'Roasted cauliflower soup', name_ar: 'شوربة قرنبيط مشوي', kcals: 55 },
        { name: 'Cinnamon Apple Yogurt', name_ar: 'زبادي بالتافح والقرفة', kcals: 180 },
        { name: 'Chicken spring roll', name_ar: 'سبرينغ رول دجاج', kcals: 110 },
      ],
    },
  },
  {
    day: 'Sunday', short: 'Sun', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Banana oatmeal with peanut butter', name_ar: 'شوفان بالموز مع زبدة الفول السوداني', kcals: 220 },
        { name: 'Cheese eggs and bacon sandwich', name_ar: 'ساندويتش بيض بالجبن ولحم مقدد', kcals: 180 },
        { name: 'Pesto chicken breakfast wrap', name_ar: 'راب دجاج بيستو للفطور', kcals: 207 },
        { name: 'Avocado toast with poached eggs', name_ar: 'توست أفوكادو مع بيض مسلوق', kcals: 175 },
      ],
      lunch: [
        { name: 'Musakhan chicken with cinnamon rice', name_ar: 'دجاج مسخن مع أرز بالقرفة', kcals: 175 },
        { name: 'Beef bamia with couscous rice', name_ar: 'لحم بقري مع أرز بالكسكس', kcals: 160 },
        { name: 'Chicken molokhiya with rice', name_ar: 'ملوخية دجاج مع أرز', kcals: 120 },
        { name: 'Grilled chicken Greek salad', name_ar: 'سلطة يونانية بالدجاج المشوي', kcals: 118 },
      ],
      dinner: [
        { name: 'Chicken club sandwich', name_ar: 'ساندويتش كلوب دجاج', kcals: 170 },
        { name: 'Shrimp and broccoli risotto', name_ar: 'ريزوتو روبيان وبروكلي', kcals: 180 },
        { name: 'Roasted garlic chicken burger', name_ar: 'برجر دجاج بالثوم المحمص', kcals: 185 },
        { name: 'Beetroot goat cheese chicken salad', name_ar: 'سلطة دجاج بالشمندر وجبن الماعز', kcals: 163 },
      ],
      snacks: [
        { name: 'Peanut butter protein bar', name_ar: 'بار بروتين بزبدة الفول السوداني', kcals: 236 },
        { name: 'Healthy chicken & broccoli soup', name_ar: 'شوربة دجاج وبروكلي صحية', kcals: 58 },
        { name: 'Mix berry Chia Pudding', name_ar: 'بودينغ الشيا بالتوت المشكل', kcals: 110 },
        { name: 'Mango float', name_ar: 'مشروب مانجو فلوت', kcals: 210 },
      ],
    },
  },
  {
    day: 'Monday', short: 'Mon', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Cinnamon french toast', name_ar: 'خبز فرنسي محمص بالقرفة', kcals: 195 },
        { name: 'Smoked turkey & egg croissant', name_ar: 'كرواسون بالبيض والديك الرومي المدخن', kcals: 220 },
        { name: 'Falafel buritto Wrap', name_ar: 'راب فلافل بوريتو', kcals: 205 },
        { name: 'Muhammara chicken sandwich', name_ar: 'ساندويتش دجاج محمرة', kcals: 170 },
      ],
      lunch: [
        { name: 'Chicken pizzaiola with white rice', name_ar: 'دجاج بيتزاولا مع أرز أبيض', kcals: 170 },
        { name: 'Garlic shrimp marinara with dill rice', name_ar: 'روبيان مارينارا بالثوم مع أرز بالشبت', kcals: 163 },
        { name: 'Peri peri chicken and rice', name_ar: 'دجاج بيري بيري مع أرز', kcals: 165 },
        { name: 'Quinoa & lentil salad with grilled shrimp', name_ar: 'سلطة الكينوا والعدس مع روبيان مشوي', kcals: 130 },
      ],
      dinner: [
        { name: 'Chicken meatball pasta', name_ar: 'معكرونة كرات اللحم بالدجاج', kcals: 180 },
        { name: 'Mushroom Swiss burger', name_ar: 'برجر الفطر والجبن السويسري', kcals: 190 },
        { name: 'Pomegranate chicken wrap', name_ar: 'راب دجاج بالرمان', kcals: 196 },
        { name: 'Green salad with grilled chicken', name_ar: 'سلطة خضراء مع دجاج مشوي', kcals: 120 },
      ],
      snacks: [
        { name: 'Mixed fruit granola bowl', name_ar: 'وعاء جرانولا بالفواكه المشكلة', kcals: 136 },
        { name: 'French onion soup', name_ar: 'حساء البصل الفرنسي', kcals: 150 },
        { name: 'Peanut butter oats', name_ar: 'شوفان بزبدة الفول السوداني', kcals: 236 },
        { name: 'Chocolate Swiss roll', name_ar: 'بار جرانولا بالشوكولاتة الداكنة', kcals: 250 },
      ],
    },
  },
  {
    day: 'Tuesday', short: 'Tue', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Eggplant fatteh', name_ar: 'فتة باذنجان', kcals: 124 },
        { name: 'Healthy sunny side up eggs', name_ar: 'بيض عيون صحي', kcals: 128 },
        { name: 'Cottage cheese chicken sandwich', name_ar: 'ساندويتش دجاج بالجبنة القريش', kcals: 180 },
        { name: 'Tropical Porridge', name_ar: 'عصيدة استوائية', kcals: 170 },
      ],
      lunch: [
        { name: 'Chicken meatballs with lemon rice', name_ar: 'كرات دجاج مع أرز بالليمون', kcals: 166 },
        { name: 'Baked salmon with kidney bean rice', name_ar: 'سلمون مشوي مع أرز بالفاصوليا الحمراء', kcals: 163 },
        { name: 'Grilled chicken with potato rice', name_ar: 'دجاج مشوي مع أرز بالبطاطا', kcals: 175 },
        { name: 'Harak osbao', name_ar: 'حلوى هاراك أوسباو', kcals: 170 },
      ],
      dinner: [
        { name: 'Chicken Quesadilla', name_ar: 'كاساديا دجاج', kcals: 178 },
        { name: 'Smoked onion beef burger', name_ar: 'برجر لحم بقري بالبصل المدخن', kcals: 200 },
        { name: 'Basil & spinach shrimp pasta', name_ar: 'معكرونة روبيان بالريحان والسبانخ', kcals: 182 },
        { name: 'Honey mustard chicken salad', name_ar: 'سلطة دجاج بالعسل والخردل', kcals: 168 },
      ],
      snacks: [
        { name: 'Matcha tiramisu', name_ar: 'تيراميسو ماتشا', kcals: 380 },
        { name: 'Exotic granola', name_ar: 'جرانولا مميزة', kcals: 160 },
        { name: 'Chicken and corn soup', name_ar: 'حساء دجاج بالذرة', kcals: 72 },
        { name: 'Dark chocolate peanut butter balls', name_ar: 'كرات زبدة الفول السوداني بالشوكولاتة الداكنة', kcals: 230 },
      ],
    },
  },
  {
    day: 'Wednesday', short: 'Wed', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Mix berry compote pancake', name_ar: 'بان كيك كومبوت التوت المشكل', kcals: 204 },
        { name: 'Mushroom egg & cheese croissant', name_ar: 'كرواسون بالفطر والبيض والجبن', kcals: 180 },
        { name: 'Scambled egg & turkey ham sandwich', name_ar: 'ساندويتش بيض مخفوق مع لحم ديك رومي', kcals: 190 },
        { name: 'Tuna avocado sandwich with capers', name_ar: 'ساندويتش تونة وأفوكادو مع الكبر', kcals: 203 },
      ],
      lunch: [
        { name: 'Bukhari rice with chicken & Rob Khiyar', name_ar: 'أرز بخاري مع دجاج وروب خيار', kcals: 166 },
        { name: 'Shrimp Biryani', name_ar: 'برياني روبيان', kcals: 163 },
        { name: 'Butter chicken with saffron rice', name_ar: 'دجاج بالزبدة مع أرز بالزعفران', kcals: 178 },
        { name: 'Chicken Caesar salad', name_ar: 'سلطة سيزر دجاج', kcals: 153 },
      ],
      dinner: [
        { name: 'Cajun chicken Burger', name_ar: 'برجر دجاج كاجون', kcals: 195 },
        { name: 'Tenderloin steak with mash potaotes', name_ar: 'ستيك تندرلوين مع بطاطا مهروسة', kcals: 197 },
        { name: 'Chicken pesto fettuccine', name_ar: 'فيتوتشيني دجاج بيستو', kcals: 184 },
        { name: 'Grilled corn and chicken salad', name_ar: 'سلطة ذرة مشوية ودجاج', kcals: 130 },
      ],
      snacks: [
        { name: 'Tropical chia pudding parafit', name_ar: 'بارافيت بودينغ الشيا الاستوائي', kcals: 160 },
        { name: 'Chicken mushroom puffs', name_ar: 'فطائر دجاج بالفطر', kcals: 230 },
        { name: 'Quinoa tabbouleh salad', name_ar: 'سلطة تبولة الكينوا', kcals: 130 },
        { name: 'Berry bloom cheese cake', name_ar: 'تشيز كيك بزهرة التوت', kcals: 270 },
      ],
    },
  },
  {
    day: 'Thursday', short: 'Thu', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Pepperoni egg and cheese sandwich', name_ar: 'ساندويتش بيبروني بالبيض والجبن', kcals: 186 },
        { name: 'Ful medames with boiled eggs', name_ar: 'فول مدمس مع بيض مسلوق', kcals: 140 },
        { name: 'Spinach eggs and cheese pita', name_ar: 'بيتا بالسبانخ والبيض والجبن', kcals: 190 },
        { name: 'Oats with fruits and nuts', name_ar: 'شوفان مع فواكه ومكسرات', kcals: 195 },
      ],
      lunch: [
        { name: 'Dawood basha with vermicelli rice', name_ar: 'داوود باشا مع أرز الشعيرية', kcals: 180 },
        { name: 'Chicken Stir Fry with Coriander Rice', name_ar: 'دجاج مقلي مع أرز بالكزبرة', kcals: 156 },
        { name: 'Grilled fish with dill rice', name_ar: 'سمك مشوي مع أرز بالشبت', kcals: 167 },
        { name: 'Rocca salad with shredded beef', name_ar: 'سلطة جرجير مع لحم بقري مبشور', kcals: 92 },
      ],
      dinner: [
        { name: 'Chicken BLT sandwich', name_ar: 'ساندويتش دجاج بي إل تي', kcals: 200 },
        { name: 'Protein chicken power bowl', name_ar: 'طبق بروتين دجاج باور بول', kcals: 170 },
        { name: 'Bacon jam beef burger', name_ar: 'برجر لحم بقري مع مربى لحم مقدد', kcals: 210 },
        { name: 'Grilled Teriyaki Chicken Salad', name_ar: 'سلطة دجاج ترياكي مشوي', kcals: 108 },
      ],
      snacks: [
        { name: 'Raspberry granola bowl', name_ar: 'طبق جرانولا بالتوت', kcals: 130 },
        { name: 'Creamy cucumber salad', name_ar: 'سلطة خيار كريمية', kcals: 92 },
        { name: 'Protien Chocolate mousse', name_ar: 'موس بروتين شوكولاتة', kcals: 200 },
        { name: 'Chocolate peanut bar', name_ar: 'بار شوكولاتة بالفول السوداني', kcals: 240 },
      ],
    },
  },
];

export const MENU_2026: DailyMenu[] = [
  {
    day: 'Saturday', short: 'Sat', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Eggs & velvet hummus Sandwich', name_ar: 'ساندوتش بيض وحمص مخملي', kcals: 177 },
        { name: 'Buttermilk Bacon Pancakes', name_ar: 'فطائر بان كيك باللبن الرائب والبيكون', kcals: 200 },
        { name: 'Egg and cheese pesto quesadilla', name_ar: 'كاساديا بيض وجبن بيستو', kcals: 195 },
        { name: 'Grilled halloumi & zaatar Croissant', name_ar: 'كرواسون حلومي مشوي مع زعتر', kcals: 192 },
      ],
      lunch: [
        { name: 'Chicken Stir Fry with Coriander Rice', name_ar: 'دجاج مقلي مع أرز بالكزبرة', kcals: 156 },
        { name: 'Spicy shrimp rose pasta', name_ar: 'معكرونة روبيان حارة', kcals: 185 },
        { name: 'Chicken mashkhool', name_ar: 'دجاج مشوي', kcals: 173 },
        { name: 'Quinoa & berry Chicken Salad', name_ar: 'سلطة دجاج بالكينوا والتوت', kcals: 135 },
      ],
      dinner: [
        { name: 'Basil & Spinach Chicken Pasta', name_ar: 'معكرونة دجاج بالريحان والسبانخ', kcals: 160 },
        { name: 'Keto angus beef burger', name_ar: 'برجر لحم أنجوس كيتو', kcals: 174 },
        { name: 'Spinach chicken risotto', name_ar: 'ريزوتو دجاج بالسبانخ', kcals: 183 },
        { name: 'Crunchy chicken tahini salad', name_ar: 'سلطة دجاج مقرمشة مع طحينة', kcals: 148 },
      ],
      snacks: [
        { name: 'Gil-E-Firdaus pudding', name_ar: 'بودينغ جيل إي فردوس', kcals: 165 },
        { name: 'Roasted cauliflower soup', name_ar: 'شوربة قرنبيط مشوي', kcals: 55 },
        { name: 'Dark chocolate peanut butter balls', name_ar: 'كرات زبدة الفول السوداني بالشوكولاتة الداكنة', kcals: 230 },
        { name: 'Chicken spring roll', name_ar: 'سبرينغ رول دجاج', kcals: 110 },
      ],
    },
  },
  {
    day: 'Sunday', short: 'Sun', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Scrambled eggs & halloumi with toast', name_ar: 'بيض مخفوق مع حلومي وتوست', kcals: 155 },
        { name: 'labneh egg crepe', name_ar: 'كريب بيض باللبنة', kcals: 140 },
        { name: 'Cheese eggs and bacon sandwich', name_ar: 'ساندويتش بيض بالجبن ولحم مقدد', kcals: 180 },
        { name: 'Muhammara chicken sandwich', name_ar: 'ساندويتش دجاج محمرة', kcals: 170 },
      ],
      lunch: [
        { name: 'Shish Tawook chicken with white rice', name_ar: 'شيش طاووق دجاج مع أرز أبيض', kcals: 160 },
        { name: 'Chicken calzone', name_ar: 'كالزون دجاج', kcals: 185 },
        { name: 'Iranian Chicken with Kabuli Rice', name_ar: 'دجاج إيراني مع أرز كابولي', kcals: 165 },
        { name: 'Grilled chicken Greek salad', name_ar: 'سلطة يونانية مع دجاج مشوي', kcals: 118 },
      ],
      dinner: [
        { name: 'Chimichurri Chicken & Roasted Potatoes', name_ar: 'دجاج تشيميتشوري مع بطاطا مشوية', kcals: 180 },
        { name: 'Creamy meatballs with dill rice', name_ar: 'كرات لحم كريمية مع أرز بالشبت', kcals: 185 },
        { name: 'Buttermilk Crispy Chicken Burger', name_ar: 'برجر دجاج مقرمش باللبن الرائب', kcals: 200 },
        { name: 'Berry chicken spinach salad', name_ar: 'سلطة دجاج بالتوت والسبانخ', kcals: 140 },
      ],
      snacks: [
        { name: 'Peanut butter protein bar', name_ar: 'بار بروتين بزبدة الفول السوداني', kcals: 236 },
        { name: 'Healthy chicken & broccoli soup', name_ar: 'شوربة دجاج وبروكلي صحية', kcals: 58 },
        { name: 'Raspberry Chia Pudding', name_ar: 'بودينغ الشيا بالتوت', kcals: 110 },
        { name: 'Mango float', name_ar: 'مشروب مانجو فلوت', kcals: 210 },
      ],
    },
  },
  {
    day: 'Monday', short: 'Mon', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'French Toast with Berries', name_ar: 'خبز فرنسي محمص بالتوت', kcals: 204 },
        { name: 'Smoked turkey & egg croissant', name_ar: 'كرواسون بالبيض والديك الرومي المدخن', kcals: 220 },
        { name: 'Greek omelette with sun-dried tomatoes', name_ar: 'أومليت يوناني مع طماطم مجففة', kcals: 160 },
        { name: 'Pesto chicken breakfast wrap', name_ar: 'راب دجاج بيستو للفطور', kcals: 207 },
      ],
      lunch: [
        { name: 'Chicken pizzaiola with white rice', name_ar: 'بيتزا دجاج مع أرز أبيض', kcals: 170 },
        { name: 'Thai shrimp curry with rice', name_ar: 'كاري روبيان تايلاندي مع أرز', kcals: 160 },
        { name: 'Chicken meatball pasta', name_ar: 'معكرونة كرات الدجاج', kcals: 180 },
        { name: 'Quinoa & lentil salad with grilled shrimp', name_ar: 'سلطة الكينوا والعدس مع روبيان مشوي', kcals: 130 },
      ],
      dinner: [
        { name: 'Chicken and mushroom risotto', name_ar: 'ريزوتو دجاج وفطر', kcals: 184 },
        { name: 'kimchi beef burger', name_ar: 'برجر لحم بقري بالكيمتشي', kcals: 190 },
        { name: 'Pomegranate chicken wrap', name_ar: 'راب دجاج بالرمان', kcals: 196 },
        { name: 'Beetroot goat cheese chicken salad', name_ar: 'سلطة دجاج بالشمندر وجبن الماعز', kcals: 163 },
      ],
      snacks: [
        { name: 'Mixed fruit granola bowl', name_ar: 'وعاء جرانولا بالفواكه المشكلة', kcals: 136 },
        { name: 'Chicken and corn soup', name_ar: 'حساء دجاج وذرة', kcals: 72 },
        { name: 'Peanut butter oats', name_ar: 'شوفان بزبدة الفول السوداني', kcals: 236 },
        { name: 'Chocolate Swiss roll', name_ar: 'سويس رول بالشوكولاتة', kcals: 250 },
      ],
    },
  },
  {
    day: 'Tuesday', short: 'Tue', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Eggplant fatteh', name_ar: 'فتة باذنجان', kcals: 124 },
        { name: 'Bacon & avocado egg croissant', name_ar: 'كرواسون بيض مع لحم مقدد وأفوكادو', kcals: 220 },
        { name: 'Mexican eggs fritatta', name_ar: 'فريتاتا بيض مكسيكية', kcals: 160 },
        { name: 'Healthy Shawarma wrap', name_ar: 'راب شاورما صحي', kcals: 193 },
      ],
      lunch: [
        { name: 'Peri peri chicken and rice', name_ar: 'دجاج بيري بيري مع أرز', kcals: 165 },
        { name: 'Tenderloin steak with entrecote sauce', name_ar: 'شريحة لحم تندرلوين مع صلصة إنتروكوت', kcals: 200 },
        { name: 'Chicken Biryani', name_ar: 'برياني دجاج', kcals: 162 },
        { name: 'Chicken beetroot salad', name_ar: 'سلطة دجاج بالشمندر', kcals: 127 },
      ],
      dinner: [
        { name: 'Garlic butter salmon & mash potatoes', name_ar: 'سلمون بالزبدة والثوم مع بطاطا مهروسة', kcals: 158 },
        { name: 'Bukhari rice with chicken & Rob Khiyar', name_ar: 'أرز بخاري مع دجاج وروب خيار', kcals: 166 },
        { name: 'Chipotle chicken burger', name_ar: 'برجر دجاج شيبوتلي', kcals: 182 },
        { name: 'Arabian salad with grilled chicken', name_ar: 'سلطة عربية مع دجاج مشوي', kcals: 112 },
      ],
      snacks: [
        { name: 'Kunafa cake', name_ar: 'كعكة كنافة', kcals: 270 },
        { name: 'Mexican corn dip & Nachos', name_ar: 'متبل ذرة مكسيكي مع ناتشوز', kcals: 240 },
        { name: 'Pumpkin soup', name_ar: 'شوربة يقطين', kcals: 70 },
        { name: 'Cinnamon Apple Yogurt', name_ar: 'زبادي تفاح بالقرفة', kcals: 180 },
      ],
    },
  },
  {
    day: 'Wednesday', short: 'Wed', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Smoked turkey wrap', name_ar: 'راب ديك رومي مدخن', kcals: 190 },
        { name: 'Mushroom egg & cheese croissant', name_ar: 'كرواسون بالفطر والبيض والجبن', kcals: 220 },
        { name: 'Eggs and avocado on sourdough bread', name_ar: 'بيض وأفوكادو على خبز العجين المخمر', kcals: 185 },
        { name: 'Healthy sunny side up eggs', name_ar: 'بيض عيون صحي', kcals: 128 },
      ],
      lunch: [
        { name: 'Chicken quesadilla', name_ar: 'كاساديا دجاج', kcals: 178 },
        { name: 'Fish Majboos', name_ar: 'مجبوس سمك', kcals: 160 },
        { name: 'Stuffed chciken breast with white rice', name_ar: 'صدر دجاج محشو بالأرز الأبيض', kcals: 153 },
        { name: 'Peach & burrata salad with chicken', name_ar: 'سلطة خوخ وبوراتا مع دجاج', kcals: 150 },
      ],
      dinner: [
        { name: 'Chicken Club sandwich', name_ar: 'ساندويتش كلوب دجاج', kcals: 170 },
        { name: 'Pulled beef quesadilla', name_ar: 'كاساديا لحم بقري مسحب', kcals: 195 },
        { name: 'Honey garlic chicken with rice', name_ar: 'دجاج بالعسل والثوم مع أرز', kcals: 180 },
        { name: 'Feta passionfruit salad with chicken', name_ar: 'سلطة فيتا وفاكهة الباشن مع دجاج', kcals: 110 },
      ],
      snacks: [
        { name: 'Tropical chia pudding parafit', name_ar: 'بارافيت بودينغ الشيا الاستوائي', kcals: 160 },
        { name: 'Creamy cucumber salad', name_ar: 'سلطة خيار كريمية', kcals: 85 },
        { name: 'Apple raisin oat bar', name_ar: 'بار شوفان بالتفاح والزبيب', kcals: 250 },
        { name: 'Berry bloom cheese cake', name_ar: 'تشيز كيك بيري بلوم', kcals: 270 },
      ],
    },
  },
  {
    day: 'Thursday', short: 'Thu', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Pepperoni egg and cheese sandwich', name_ar: 'ساندويتش بيبروني بيض وجبن', kcals: 186 },
        { name: 'Falafel eggplant wrap', name_ar: 'راب فلافل باذنجان', kcals: 208 },
        { name: 'Spanish omelet', name_ar: 'أومليت إسباني', kcals: 180 },
        { name: 'Raspberry Burrata French toast', name_ar: 'خبز فرنسي محمص مع بوراتا وتوت العليق', kcals: 195 },
      ],
      lunch: [
        { name: 'Dawood basha with vermicelli rice', name_ar: 'داوود باشا مع أرز فيرميشيلي', kcals: 180 },
        { name: 'Roast pumpkin chicken pasta', name_ar: 'معكرونة دجاج باليقطين المشوي', kcals: 152 },
        { name: 'Teriyaki chicken rice bowl', name_ar: 'طبق أرز مع دجاج ترياكي', kcals: 162 },
        { name: 'Rocca salad with shredded beef', name_ar: 'سلطة جرجير مع لحم بقري مبشور', kcals: 92 },
      ],
      dinner: [
        { name: 'Chicken BLT sandwich', name_ar: 'ساندويتش دجاج بي إل تي', kcals: 200 },
        { name: 'Healthy Shrimp mmawash', name_ar: 'روبيان صحي', kcals: 145 },
        { name: 'Protein chicken power bowl', name_ar: 'طبق بروتين دجاج', kcals: 170 },
        { name: 'Grilled Teriyaki Chicken Salad', name_ar: 'سلطة دجاج ترياكي مشوي', kcals: 108 },
      ],
      snacks: [
        { name: 'Raspberry granola bowl', name_ar: 'طبق جرانولا بالتوت', kcals: 136 },
        { name: 'Stuffed grape leaves', name_ar: 'ورق عنب محشي', kcals: 92 },
        { name: 'Banana Oatmeal', name_ar: 'شوفان بالموز', kcals: 202 },
        { name: 'Chocolate peanut bar', name_ar: 'بار شوكولاتة بالفول السوداني', kcals: 240 },
      ],
    },
  },
];

export const SUMMER_J: DailyMenu[] = [
  {
    day: 'Saturday', short: 'Sat', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Tuna avocado sandwich with capers', name_ar: 'ساندويتش تونة وأفوكادو مع الكبر', kcals: 203 },
        { name: 'Cheese eggs and bacon sandwich', name_ar: 'ساندويتش جبن وبيض ولحم بقري مقدد', kcals: 180 },
        { name: 'Grilled halloumi and zaatar sandwich', name_ar: 'ساندويتش حلوم مشوي مع الزعتر', kcals: 180 },
        { name: 'Healthy berry pancakes', name_ar: 'بان كيك صحي بالتوت', kcals: 185 },
      ],
      lunch: [
        { name: 'Creamy cajun chicken fettuccine', name_ar: 'فيتوتشيني دجاج كاجون بالكريمة', kcals: 184 },
        { name: 'Sweet potato burger bowl', name_ar: 'بيرجر بول مع البطاطا الحلوه', kcals: 187 },
        { name: 'Musakhan chicken with cinnamon rice', name_ar: 'دجاج مسخن مع أرز بالقرفة', kcals: 175 },
        { name: 'Spinach chicken salad', name_ar: 'سلطة الدجاج والسبانخ', kcals: 134 },
      ],
      dinner: [
        { name: 'Chicken BLT sandwich', name_ar: 'ساندويتش دجاج BLT', kcals: 200 },
        { name: 'Basil & spinach shrimp pasta', name_ar: 'باستا روبيان بالريحان والسبانخ', kcals: 182 },
        { name: 'Beef bamia with couscous rice', name_ar: 'بامية باللحم مع أرز الكسكسي', kcals: 160 },
        { name: 'Crunchy chicken tahini salad', name_ar: 'سلطة دجاج مقرمشة مع الطحينة', kcals: 148 },
      ],
      snacks: [
        { name: 'Chocolate covered dates', name_ar: 'تمر مغطى بالشوكولاتة', kcals: 244 },
        { name: 'french onion beef soup', name_ar: 'شوربة لحم بالبصل الفرنسي', kcals: 100 },
        { name: 'Green salad', name_ar: 'سلطة خضراء', kcals: 60 },
        { name: 'Overnight oats', name_ar: 'شوفان منقوع طوال الليل', kcals: 202 },
      ],
    },
  },
  {
    day: 'Sunday', short: 'Sun', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Cheese & broccoli omelette', name_ar: 'أومليت الجبن والبروكلي', kcals: 186 },
        { name: 'Avocado toast with spinach florentine', name_ar: 'توست الأفوكادو مع سبانخ فلورنتين', kcals: 180 },
        { name: 'Pesto chicken panini', name_ar: 'بانيني دجاج بالبيستو', kcals: 207 },
        { name: 'English breakfast', name_ar: 'فطور إنجليزي', kcals: 160 },
      ],
      lunch: [
        { name: 'Peri peri chicken and rice', name_ar: 'دجاج بيري بيري مع الأرز', kcals: 178 },
        { name: 'Fish majboos & mint yoghurt', name_ar: 'مجبوس سمك مع روب بالنعناع', kcals: 164 },
        { name: 'Spinach chicken risotto', name_ar: 'ريزوتو الدجاج والسبانخ', kcals: 183 },
        { name: 'Pineapple chicken salad', name_ar: 'سلطة الدجاج والأناناس', kcals: 150 },
      ],
      dinner: [
        { name: 'Chicken pizzaiola with mashed potatoes', name_ar: 'دجاج بيتزاولا مع البطاطس المهروسة', kcals: 170 },
        { name: 'Healthy beef tacos', name_ar: 'تاكو لحم صحي', kcals: 172 },
        { name: 'Honey mustard chicken burger', name_ar: 'بيرجر دجاج بصوص العسل والخردل', kcals: 185 },
        { name: 'Mediterranean Chickpea Quinoa Salad', name_ar: 'سلطة ميديتيرينيان بالحمص والكينوا', kcals: 145 },
      ],
      snacks: [
        { name: 'Chicken Stuffed zucchini\'s', name_ar: 'كوسا محشية بالدجاج', kcals: 168 },
        { name: 'Healthy chicken & broccoli soup', name_ar: 'شوربة دجاج صحية بالبروكلي', kcals: 58 },
        { name: 'Raspberry and granola yoghurt', name_ar: 'زبادي بالتوت العليق والجرانولا', kcals: 110 },
        { name: 'Peanut butter oats', name_ar: 'شوفان بزبدة الفول السوداني', kcals: 236 },
      ],
    },
  },
  {
    day: 'Monday', short: 'Mon', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Muhammara chicken sandwich', name_ar: 'ساندويتش دجاج بالمحمرة', kcals: 170 },
        { name: 'Cinnamon french toast', name_ar: 'فرنش توست بالقرفة', kcals: 190 },
        { name: 'Smoked turkey breakfast sandwich', name_ar: 'ساندويتش فطور بديك رومي مدخن', kcals: 212 },
        { name: 'Egg salad sandwich', name_ar: 'ساندويتش سلطة البيض', kcals: 220 },
      ],
      lunch: [
        { name: 'Bukhari rice with chicken & Rob Khiyar', name_ar: 'أرز بخاري بالدجاج مع روب خيار', kcals: 170 },
        { name: 'Beef stroganoff with white rice', name_ar: 'ستروغانوف لحم مع أرز أبيض', kcals: 183 },
        { name: 'Coconut curry chicken with rice', name_ar: 'دجاج بكاري جوز الهند مع الأرز', kcals: 162 },
        { name: 'Grilled shrimp & corn salad', name_ar: 'سلطة الروبيان المشوي والذرة', kcals: 130 },
      ],
      dinner: [
        { name: 'Butter garlic shrimp spaghetti', name_ar: 'سباغيتي الروبيان بالزبدة والثوم', kcals: 170 },
        { name: 'Pomegranate beef burger', name_ar: 'بيرجر لحم بالرمان', kcals: 190 },
        { name: 'Chicken fajita wrap & sweet potato fries', name_ar: 'راب دجاج فاهيتا مع بطاطا حلوة', kcals: 175 },
        { name: 'Orange rocca chicken salad', name_ar: 'سلطة دجاج بالروكا والبرتقال', kcals: 163 },
      ],
      snacks: [
        { name: 'vanilla protein mousse', name_ar: 'موس بروتين بالفانيلا', kcals: 160 },
        { name: 'Beef spring roll', name_ar: 'سبرنج رول باللحم', kcals: 180 },
        { name: 'Banana Oatmeal', name_ar: 'شوفان بالموز', kcals: 202 },
        { name: 'mixed fruit granola bowl', name_ar: 'بول جرانولا بالفواكه المشكلة', kcals: 188 },
      ],
    },
  },
  {
    day: 'Tuesday', short: 'Tue', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Tuna club sandwich', name_ar: 'ساندويتش كلوب بالتونة', kcals: 188 },
        { name: 'Turkish eggs', name_ar: 'بيض تركي', kcals: 171 },
        { name: 'Lebanese chicken breakfast wrap', name_ar: 'راب فطور بالدجاج اللبناني', kcals: 163 },
        { name: 'Almond butter oats', name_ar: 'شوفان بزبدة اللوز', kcals: 236 },
      ],
      lunch: [
        { name: 'Chicken biryani', name_ar: 'برياني دجاج', kcals: 165 },
        { name: 'Jordanian lamb mansaf', name_ar: 'منسف لحم أردني', kcals: 184 },
        { name: 'Tuscan Chicken pasta', name_ar: 'باستا دجاج توسكاني', kcals: 165 },
        { name: 'Honey mustard Chicken Salad', name_ar: 'سلطة دجاج بصوص العسل والخردل', kcals: 168 },
      ],
      dinner: [
        { name: 'Creamy beef & mushroom orzo', name_ar: 'أورزو باللحم والمشروم بالكريمة', kcals: 185 },
        { name: 'Harissa shrimp pasta', name_ar: 'باستا روبيان بالهريسة', kcals: 178 },
        { name: 'Chicken Club sandwich', name_ar: 'ساندويتش كلوب بالدجاج', kcals: 190 },
        { name: 'Waldorf chicken salad', name_ar: 'سلطة دجاج والدورف', kcals: 112 },
      ],
      snacks: [
        { name: 'Tiramisu cake', name_ar: 'كيكة تيراميسو', kcals: 380 },
        { name: 'Potato leek soup', name_ar: 'شوربة البطاطس والكراث', kcals: 90 },
        { name: 'Acai berry bowl', name_ar: 'بول آساي بالتوت', kcals: 220 },
        { name: 'Baked musakhan rolls', name_ar: 'لفائف مسخن مخبوزة', kcals: 188 },
      ],
    },
  },
  {
    day: 'Wednesday', short: 'Wed', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Hummus chicken Sandwich', name_ar: 'ساندويتش دجاج بالحمص', kcals: 190 },
        { name: 'Avocado toast with poached eggs', name_ar: 'توست الأفوكادو مع البيض المسلوق', kcals: 175 },
        { name: 'Roasted pumpkin egg Sandwich', name_ar: 'ساندويتش بيض بالقرع المشوي', kcals: 164 },
        { name: 'French toast with berries & syrup', name_ar: 'فرنش توست بالتوت والشراب', kcals: 204 },
      ],
      lunch: [
        { name: 'Spaghetti bolognese', name_ar: 'سباغيتي بولونيز', kcals: 178 },
        { name: 'Garlic butter salmon & mash potatoes', name_ar: 'سلمون بصلصة الزبدة والثوم مع بطاطس', kcals: 167 },
        { name: 'Chicken mashkhool', name_ar: 'مشخول دجاج', kcals: 173 },
        { name: 'Chicken edamame salad', name_ar: 'سلطة الدجاج والإدامامي', kcals: 140 },
      ],
      dinner: [
        { name: 'Dynamite chicken & sweet potato mash', name_ar: 'دجاج داينامايت مع بطاطا حلوة مهروسة', kcals: 170 },
        { name: 'Mushroom swiss burger', name_ar: 'بيرجر سويس بالمشروم', kcals: 190 },
        { name: 'Chicken penne arrabbiata', name_ar: 'بيني دجاج أرابياتا', kcals: 160 },
        { name: 'Cajun shrimp cobb salad', name_ar: 'سلطة كوب بالروبيان الكاجون', kcals: 150 },
      ],
      snacks: [
        { name: 'Chicken and spinach puff', name_ar: 'فطاير بالدجاج والسبانخ', kcals: 260 },
        { name: 'Watermelon feta salad', name_ar: 'سلطة البطيخ وجبن الفيتا', kcals: 120 },
        { name: 'Oats and berries', name_ar: 'شوفان بالتوت', kcals: 180 },
        { name: 'Chicken and corn soup', name_ar: 'شوربة الدجاج والذرة', kcals: 90 },
      ],
    },
  },
  {
    day: 'Thursday', short: 'Thu', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Egg N\' HashBrown wrap', name_ar: 'راب البيض والهاش براون', kcals: 210 },
        { name: 'Grilled halloumi zaatar croissant', name_ar: 'كرواسون بالحلوم المشوي والزعتر', kcals: 192 },
        { name: 'Chicken salad croissant sandwich', name_ar: 'ساندويتش كرواسان بسلّطة الدجاج', kcals: 220 },
        { name: 'Cinnamon banana pancakes', name_ar: 'بان كيك بالقرفة والموز', kcals: 189 },
      ],
      lunch: [
        { name: 'Creamy spinach chicken pasta', name_ar: 'باستا دجاج بالسبانخ والكريمة', kcals: 175 },
        { name: 'Shrimp biryani', name_ar: 'برياني روبيان', kcals: 195 },
        { name: 'Velvet chicken risotto', name_ar: 'ريزوتو دجاج فيلفت', kcals: 183 },
        { name: 'Chicken Caesar salad', name_ar: 'سلطة دجاج سيزر', kcals: 153 },
      ],
      dinner: [
        { name: 'Chicken shawarma plate', name_ar: 'طبق شاورما دجاج', kcals: 165 },
        { name: 'Chimichurri steak with mashed potatoes', name_ar: 'ستيك تشيميتشوري مع بطاطس مهروسة', kcals: 197 },
        { name: 'Healthy chicken twister wrap', name_ar: 'راب تويستر دجاج صحي', kcals: 196 },
        { name: 'Grilled Teriyaki Chicken Salad', name_ar: 'سلطة دجاج ترياكي مشوي', kcals: 108 },
      ],
      snacks: [
        { name: 'Pistachio Bon Bon', name_ar: 'بون بون بالفستق', kcals: 380 },
        { name: 'Umm ali', name_ar: 'أم علي', kcals: 238 },
        { name: 'Rocca salad', name_ar: 'سلطة روكا', kcals: 92 },
        { name: 'Strawberry Cheesecake Trifle', name_ar: 'ترايفل تشيز كيك بالفراولة', kcals: 200 },
      ],
    },
  },
];

export const RAMADAN_SPECIAL: DailyMenu[] = [
  {
    day: 'Saturday', short: 'Sat', week: 1, collection: 'ramadan',
    items: {
      breakfast: [
        { name: 'Chicken & bacon avocado wrap', name_ar: 'راب الأفوكادو بالدجاج والبيكون', kcals: 156 },
        { name: 'Roasted pumpkin egg sandwich', name_ar: 'ساندويتش البيض مع اليقطين المشوي', kcals: 164 },
        { name: 'Mix berry croissant', name_ar: 'كرواسون التوت المشكل', kcals: 230 },
        { name: 'Peanut butter oats', name_ar: 'شوفان بزبدة الفول السوداني', kcals: 236 },
      ],
      lunch: [
        { name: 'Chicken majboos with rob khiyar', name_ar: 'مجبوس الدجاج مع روب خيار', kcals: 166 },
        { name: 'Beef Bamia with vermicelli rice', name_ar: 'بامية اللحم مع أرز الشعيرية', kcals: 170 },
        { name: 'Penne chicken Alfredo', name_ar: 'بيني دجاج ألفريدو', kcals: 180 },
        { name: 'Quinoa berry chicken salad', name_ar: 'سلطة دجاج بالكينوا والتوت', kcals: 130 },
      ],
      dinner: [
        { name: 'Pesto chicken sandwich', name_ar: 'ساندويتش دجاج بالبيستو', kcals: 220 },
        { name: 'Spicy shrimp rose pasta', name_ar: 'معكرونة الروبيان الحارة', kcals: 185 },
        { name: 'Swedish chicken balls & mash potatoes', name_ar: 'كرات الدجاج السويدية مع البطاطا المهروسة', kcals: 180 },
        { name: 'Crunchy chicken tahini salad', name_ar: 'سلطة دجاج مقرمشة بالطحينة', kcals: 148 },
      ],
      snacks: [
        { name: 'Saffron vermicelli pudding', name_ar: 'بودينغ الشعيرية بالزعفران', kcals: 244 },
        { name: 'Orange salad', name_ar: 'سلطة البرتقال', kcals: 78 },
        { name: 'Acai berry bowl', name_ar: 'وعاء توت الآساي', kcals: 220 },
        { name: 'Energy date balls', name_ar: 'كرات الطاقة', kcals: 168 },
      ],
    },
  },
  {
    day: 'Sunday', short: 'Sun', week: 1, collection: 'ramadan',
    items: {
      breakfast: [
        { name: 'Muhammara chicken sandwich', name_ar: 'ساندويتش دجاج محمرة', kcals: 170 },
        { name: 'Cheese and broccoli omelette', name_ar: 'أومليت بالجبن والبروكلي', kcals: 186 },
        { name: 'Egg & Turkey protein burrito', name_ar: 'بوريتو بروتين البيض والديك الرومي', kcals: 180 },
        { name: 'Cinnamon apple oat meal', name_ar: 'دقيق الشوفان مع التفاح والقرفة', kcals: 120 },
      ],
      lunch: [
        { name: 'Butter chicken noodles', name_ar: 'نودلز دجاج بالزبدة', kcals: 160 },
        { name: 'Koshary with crispy beef bacon', name_ar: 'كشري مع لحم بقري مقدد مقرمش', kcals: 195 },
        { name: 'Chicken chow mein', name_ar: 'تشاو مين دجاج', kcals: 180 },
        { name: 'chickpea chicken basil salad', name_ar: 'سلطة دجاج بالحمص والريحان', kcals: 157 },
      ],
      dinner: [
        { name: 'Caesar chicken wrap & roasted potatoes', name_ar: 'راب دجاج سيزر مع بطاطا مشوية', kcals: 177 },
        { name: 'Caramelised onion burger', name_ar: 'برجر البصل المكرمل', kcals: 205 },
        { name: 'Velvet chicken risotto', name_ar: 'ريزوتو دجاج مخملي', kcals: 183 },
        { name: 'Beetroot feta cheese chicken salad', name_ar: 'سلطة دجاج بالشمندر وجبنة الفيتا', kcals: 163 },
      ],
      snacks: [
        { name: 'Talbina', name_ar: 'تلبينة', kcals: 130 },
        { name: 'Cream of broccoli soup', name_ar: 'شوربة كريمة البروكلي', kcals: 56 },
        { name: 'Coconut chia pudding', name_ar: 'بودينج جوز الهند والشيا', kcals: 130 },
        { name: 'Triangle fruit salad', name_ar: 'سلطة فواكه مثلثة', kcals: 94 },
      ],
    },
  },
  {
    day: 'Monday', short: 'Mon', week: 1, collection: 'ramadan',
    items: {
      breakfast: [
        { name: 'Cinnamon french toast', name_ar: 'خبز فرنسي محمص بالقرفة', kcals: 195 },
        { name: 'Smoked turkey & egg croissant', name_ar: 'كرواسون بالبيض والديك الرومي المدخن', kcals: 220 },
        { name: 'Egg and velvet hummus sandwich', name_ar: 'ساندويتش حمص بالبيض والجبن المخملي', kcals: 177 },
        { name: 'Tuna club sandwich', name_ar: 'ساندويتش كلوب التونة', kcals: 188 },
      ],
      lunch: [
        { name: 'Chicken stragonoff with white rice', name_ar: 'دجاج ستراغونوف مع أرز أبيض', kcals: 175 },
        { name: 'Jordanian lamb mansaf', name_ar: 'منسف لحم ضأن أردني', kcals: 190 },
        { name: 'Grilled fish with dill rice', name_ar: 'سمك مشوي مع أرز بالشبت', kcals: 167 },
        { name: 'Chicken cobb salad', name_ar: 'سلطة كوب دجاج', kcals: 160 },
      ],
      dinner: [
        { name: 'BBQ chicken burger', name_ar: 'برجر دجاج باربيكيو', kcals: 190 },
        { name: 'Beef fajita wrap', name_ar: 'راب فاهيتا لحم بقري', kcals: 149 },
        { name: 'Chicken shawarma with roasted potatoes', name_ar: 'شاورما دجاج مع بطاطا مشوية', kcals: 175 },
        { name: 'Jarjir salad with grilled chicken', name_ar: 'سلطة جرجير مع دجاج مشوي', kcals: 163 },
      ],
      snacks: [
        { name: 'Dark chocolate granola bars', name_ar: 'ألواح جرانولا بالشوكولاتة الداكنة', kcals: 280 },
        { name: 'Tropical chia pudding parafit', name_ar: 'بارافيت بودينج الشيا الاستوائي', kcals: 160 },
        { name: 'Lentil soup', name_ar: 'شوربة عدس', kcals: 65 },
        { name: 'Cut fruit bowl', name_ar: 'طبق فواكه مشكلة', kcals: 70 },
      ],
    },
  },
  {
    day: 'Tuesday', short: 'Tue', week: 1, collection: 'ramadan',
    items: {
      breakfast: [
        { name: 'Eggplant fatteh', name_ar: 'فتة باذنجان', kcals: 124 },
        { name: 'Pepperoni egg and cheese sandwich', name_ar: 'ساندويتش بيبروني بيض وجبنة', kcals: 186 },
        { name: 'Falafel eggplant wrap', name_ar: 'لفائف فلافل باذنجان', kcals: 208 },
        { name: 'Chicken salad sandwich', name_ar: 'ساندويتش سلطة دجاج', kcals: 170 },
      ],
      lunch: [
        { name: 'Chicken moulkhiya with white rice', name_ar: 'دجاج ملوخيا مع أرز أبيض', kcals: 120 },
        { name: 'Shrimp mashkhool', name_ar: 'مشخول روبيان', kcals: 170 },
        { name: 'Butter chicken with white rice', name_ar: 'دجاج بالزبدة مع أرز أبيض', kcals: 178 },
        { name: 'Crispy corn chicken salad', name_ar: 'سلطة دجاج مقرمش', kcals: 150 },
      ],
      dinner: [
        { name: 'Mushroom chicken and baked potatoes', name_ar: 'دجاج بالفطر وبطاطا مشوية', kcals: 183 },
        { name: 'Beef thareed', name_ar: 'ثريد لحم بقري', kcals: 156 },
        { name: 'Chicken club sandwich', name_ar: 'ساندويتش كلوب دجاج', kcals: 170 },
        { name: 'Harak osbao', name_ar: 'حراق أصبعه', kcals: 170 },
      ],
      snacks: [
        { name: 'Watermelon feta salad', name_ar: 'سلطة بطيخ وجبنة فيتا', kcals: 120 },
        { name: 'Clear vegetable soup', name_ar: 'شوربة خضار صافية', kcals: 32 },
        { name: 'French toast with berries', name_ar: 'خبز فرنسي محمص مع توت', kcals: 204 },
        { name: 'Brownie', name_ar: 'براوني', kcals: 316 },
      ],
    },
  },
  {
    day: 'Wednesday', short: 'Wed', week: 1, collection: 'ramadan',
    items: {
      breakfast: [
        { name: 'Smoked turkey wrap', name_ar: 'ساندويتش ديك رومي مدخن', kcals: 190 },
        { name: 'Eggs Benedict with spinach', name_ar: 'بيض بينيديكت مع سبانخ', kcals: 175 },
        { name: 'Cheese eggs and bacon sandwich', name_ar: 'ساندويتش بيض بالجبن ولحم مقدد', kcals: 180 },
        { name: 'Caramel apple French toast', name_ar: 'خبز فرنسي محمص مع تفاح بالكراميل', kcals: 195 },
      ],
      lunch: [
        { name: 'Chicken Mandi', name_ar: 'دجاج مندي', kcals: 166 },
        { name: 'Spaghetti bolognese', name_ar: 'سباغيتي بولونيز', kcals: 178 },
        { name: 'Spinach & Mushroom chicken Risotto', name_ar: 'ريزوتو دجاج بالسبانخ والفطر', kcals: 188 },
        { name: 'Honey mustard chicken salad', name_ar: 'سلطة دجاج بالعسل والخردل', kcals: 168 },
      ],
      dinner: [
        { name: 'Chicken penne arrabbiata', name_ar: 'بيني أرابياتا دجاج', kcals: 160 },
        { name: 'Tenderloin steak with entrecote sauce', name_ar: 'شريحة لحم تندرلوين مع صلصة إنتركوت', kcals: 200 },
        { name: 'Pomegranate Chicken burger', name_ar: 'برجر دجاج بالرمان', kcals: 185 },
        { name: 'Chicken tawook fattoush salad', name_ar: 'سلطة فتوش طاووق دجاج', kcals: 113 },
      ],
      snacks: [
        { name: 'Chicken spring rolls', name_ar: 'لفائف دجاج ربيعية', kcals: 101 },
        { name: 'Mango chia pudding', name_ar: 'بودنج مانجو وشيا', kcals: 100 },
        { name: 'Oats meal with berries', name_ar: 'دقيق شوفان مع توت', kcals: 120 },
        { name: 'Chicken & corn soup', name_ar: 'حساء دجاج وذرة', kcals: 72 },
      ],
    },
  },
  {
    day: 'Thursday', short: 'Thu', week: 1, collection: 'ramadan',
    items: {
      breakfast: [
        { name: 'Egg N\' Hash Browns Wrap', name_ar: 'راب بالبيض و هاش براوني', kcals: 210 },
        { name: 'Mushroom egg & cheese sandwich', name_ar: 'ساندويتش البيض والفطر والجبن', kcals: 180 },
        { name: 'Sweet potato breakfast hash', name_ar: 'هاش البطاطا الحلوة للفطور', kcals: 160 },
        { name: 'Cinnamon banana pancakes', name_ar: 'فطائر الموز بالقرفة', kcals: 189 },
      ],
      lunch: [
        { name: 'Shawarma chicken with beetroot rice', name_ar: 'شاورما دجاج مع أرز الشمندر', kcals: 149 },
        { name: 'Pesto fusilli salmon pasta', name_ar: 'معكرونة فوسيلي بالبيستو والسلمون', kcals: 166 },
        { name: 'Shish tawook with couscous rice', name_ar: 'شيش طاووق مع أرز الكسكس', kcals: 160 },
        { name: 'Rocca with shredded beef & goat cheese', name_ar: 'جرجير مع لحم بقري مبشور وجبن ماعز', kcals: 120 },
      ],
      dinner: [
        { name: 'Chimichurri chicken & roasted potatoes', name_ar: 'دجاج تشيميتشوري مع بطاطا مشوية', kcals: 180 },
        { name: 'Shrimp chow mein', name_ar: 'تشاو مين بالروبيان', kcals: 172 },
        { name: 'Tandoori chicken sandwich', name_ar: 'ساندويتش دجاج تندوري', kcals: 210 },
        { name: 'Feta passionfruit salad with chicken', name_ar: 'سلطة فيتا مع فاكهة الباشن فروت والدجاج', kcals: 110 },
      ],
      snacks: [
        { name: 'Blueberry muffin', name_ar: 'مافن التوت الأزرق', kcals: 255 },
        { name: 'Creamy potato and parsley soup', name_ar: 'حساء البطاطا الكريمي والبقدونس', kcals: 89 },
        { name: 'Umm ali', name_ar: 'أم علي', kcals: 238 },
        { name: 'Sunflower seed energy bites', name_ar: 'كرات طاقة ببذور دوار الشمس', kcals: 380 },
      ],
    },
  },
];

export const SUMMER_COLLECTION: DailyMenu[] = [
  {
    day: 'Saturday', short: 'Sat', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Chicken salad croissant sandwich', name_ar: 'ساندويتش كرواسون بسلطة الدجاج', kcals: 220 },
        { name: 'Mushroom egg and cheese sandwich', name_ar: 'ساندويتش بيض وجبن بالفطر', kcals: 180 },
        { name: 'Grilled halloumi sandwich', name_ar: 'ساندويتش حلومي مشوي', kcals: 180 },
        { name: 'Healthy berry pancakes', name_ar: 'فطائر التوت الصحية', kcals: 185 },
      ],
      lunch: [
        { name: 'Stuffed Chicken Breast with white rice', name_ar: 'صدر دجاج محشو بالأرز الأبيض', kcals: 153 },
        { name: 'Creamy beef & Mushroom pasta', name_ar: 'معكرونة بالكريمة واللحم والفطر', kcals: 179 },
        { name: 'Butter chicken with saffron rice', name_ar: 'دجاج بالزبدة مع أرز بالزعفران', kcals: 178 },
        { name: 'Chicken beetroot salad', name_ar: 'سلطة دجاج بالشمندر', kcals: 127 },
      ],
      dinner: [
        { name: 'Chicken BLT sandwich', name_ar: 'ساندويتش دجاج بي إل تي', kcals: 200 },
        { name: 'Spicy shrimp rose pasta', name_ar: 'معكرونة الروبيان الحار', kcals: 185 },
        { name: 'Tandoori chicken with couscous rice', name_ar: 'دجاج تندوري مع أرز بالكسكس', kcals: 174 },
        { name: 'Crunchy chicken tahini salad', name_ar: 'سلطة دجاج مقرمشة بالطحينة', kcals: 148 },
      ],
      snacks: [
        { name: 'Chocolate dipped date', name_ar: 'تمر مغطس بالشوكولاتة', kcals: 244 },
        { name: 'Carrot and celery soup', name_ar: 'شوربة جزر وكرفس', kcals: 75 },
        { name: 'Green salad', name_ar: 'سلطة خضراء', kcals: 280 },
        { name: 'Overnight oats', name_ar: 'شوفان منقوع طوال الليل', kcals: 202 },
      ],
    },
  },
  {
    day: 'Sunday', short: 'Sun', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Cheese & brocolli omelette', name_ar: 'أومليت بالجبن والبروكلي', kcals: 186 },
        { name: 'Cheese eggs and bacon sandwich', name_ar: 'ساندويتش بيض بالجبن ولحم مقدد', kcals: 180 },
        { name: 'Pesto chicken breakfast wrap', name_ar: 'راب دجاج بيستو للفطور', kcals: 207 },
        { name: 'Peanut butter oats', name_ar: 'شوفان بزبدة الفول السوداني', kcals: 236 },
      ],
      lunch: [
        { name: 'Teriyaki chicken rice bowl', name_ar: 'طبق أرز مع دجاج ترياكي', kcals: 170 },
        { name: 'Fish majboos & mint yoghurt', name_ar: 'مجبوس سمك مع زبادي بالنعناع', kcals: 164 },
        { name: 'Truffle shrimp Risotto', name_ar: 'ريزوتو الروبيان بالفقاعة', kcals: 183 },
        { name: 'Grilled chicken Greek salad', name_ar: 'سلطة يونانية مع دجاج مشوي', kcals: 118 },
      ],
      dinner: [
        { name: 'Chicken pesto fettuccine', name_ar: 'فيتوتشيني دجاج بيستو', kcals: 184 },
        { name: 'Classic beef burger', name_ar: 'برجر لحم بقري كلاسيكي', kcals: 190 },
        { name: 'Chicken fajita & roasted cauliflower', name_ar: 'فاهيتا دجاج مع قرنبيط مشوي', kcals: 178 },
        { name: 'Buffalo chicken salad', name_ar: 'سلطة دجاج بافلو', kcals: 130 },
      ],
      snacks: [
        { name: 'Chicken Stuffed zucchini\'s', name_ar: 'كوسا محشوة بالدجاج', kcals: 168 },
        { name: 'Healthy chicken & broccoli soup', name_ar: 'قطع الكاجو بالشوكولاتة', kcals: 58 },
        { name: 'Raspberry Chia Pudding', name_ar: 'بودينغ الشيا بالتوت', kcals: 110 },
        { name: 'Triangle fruit salad', name_ar: 'سلطة فواكه مثلثة', kcals: 94 },
      ],
    },
  },
  {
    day: 'Monday', short: 'Mon', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Cinnamon french toast', name_ar: 'خبز فرنسي محمص بالقرفة', kcals: 195 },
        { name: 'Smoked turkey & egg croissant', name_ar: 'كرواسون بالبيض والديك الرومي المدخن', kcals: 220 },
        { name: 'Egg salad sandwich', name_ar: 'ساندويتش سلطة البيض', kcals: 212 },
        { name: 'Tuna avocado sandwich with capers', name_ar: 'ساندويتش التونة والأفوكادو مع الكبر', kcals: 203 },
      ],
      lunch: [
        { name: 'Chicken pizzaiola with white', name_ar: 'بيتزا دجاج بالجبن الأبيض', kcals: 170 },
        { name: 'Thai shrimp curry with rice', name_ar: 'كاري روبيان تايلاندي مع الأرز', kcals: 160 },
        { name: 'Chicken Biryani', name_ar: 'برياني دجاج', kcals: 162 },
        { name: 'Quinoa & lentil salad with grilled shrimp', name_ar: 'سلطة الكينوا والعدس مع الروبيان المشوي', kcals: 130 },
      ],
      dinner: [
        { name: 'Chicken and mushroom Risotto', name_ar: 'ريزوتو دجاج وفطر', kcals: 184 },
        { name: 'Spaghetti Bolognese', name_ar: 'سباجيتي بولونيز', kcals: 178 },
        { name: 'Pomegranate chicken wrap', name_ar: 'راب دجاج بالرمان', kcals: 196 },
        { name: 'Beetroot Goat cheese chicken salad', name_ar: 'سلطة دجاج بالشمندر وجبن الماعز', kcals: 163 },
      ],
      snacks: [
        { name: 'Fennel soup', name_ar: 'شوربة الشمر', kcals: 78 },
        { name: 'Chocolate cashew bites', name_ar: 'سلطة بطيخ بالفيتا', kcals: 65 },
        { name: 'Banana Oatmeal', name_ar: 'دقيق الشوفان بالموز', kcals: 202 },
        { name: 'mixed fruit granola bowl', name_ar: 'وعاء جرانولا بالفواكه المشكلة', kcals: 188 },
      ],
    },
  },
  {
    day: 'Tuesday', short: 'Tue', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Eggplant fatteh', name_ar: 'فتة باذنجان', kcals: 124 },
        { name: 'Pepperoni egg and cheese sandwich', name_ar: 'ساندويتش بيض وجبن بالبيبروني', kcals: 186 },
        { name: 'Healthy sunny side up eggs', name_ar: 'بيض عيون صحي', kcals: 128 },
        { name: 'Healthy Shawarma wrap', name_ar: 'راب شاورما صحية', kcals: 193 },
      ],
      lunch: [
        { name: 'Peri peri chicken and rice', name_ar: 'أرز بخاري دجاج مع زبادي بالنعناع', kcals: 178 },
        { name: 'Pesto shell pasta with grilled shrimps', name_ar: 'برياني روبيان', kcals: 184 },
        { name: 'Chicken katsu curry with white rice', name_ar: 'دجاج مشوي مع أرز بالكسكس', kcals: 165 },
        { name: 'Honey mustard Chicken Salad', name_ar: 'سلطة سيزر دجاج', kcals: 168 },
      ],
      dinner: [
        { name: 'Chicken quesadilla', name_ar: 'كاساديا دجاج', kcals: 160 },
        { name: 'Meat shawarma plate', name_ar: 'طبق شاورما لحم', kcals: 183 },
        { name: 'Crunchy Chicken burger', name_ar: 'برجر دجاج مقرمش', kcals: 183 },
        { name: 'Arabian salad with grilled chicken', name_ar: 'سلطة عربية مع دجاج مشوي', kcals: 112 },
      ],
      snacks: [
        { name: 'Tiramisu cake', name_ar: 'كيكة تيراميسو', kcals: 380 },
        { name: 'Potato leek soup', name_ar: 'شوربة بطاطس وكراث', kcals: 90 },
        { name: 'Cinnamon Apple Yogurt', name_ar: 'زبادي تفاح بالقرفة', kcals: 180 },
        { name: 'Baked musakhan rolls', name_ar: 'لفائف مسخن مخبوزة', kcals: 188 },
      ],
    },
  },
  {
    day: 'Wednesday', short: 'Wed', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Mexican eggs fritatta', name_ar: 'فريتا البيض المكسيكية', kcals: 160 },
        { name: 'Zatar omelet', name_ar: 'أومليت الزعتر', kcals: 154 },
        { name: 'Roasted pumpkin egg Sandwich', name_ar: 'ساندويتش بيض اليقطين المشوي', kcals: 164 },
        { name: 'French toast with berries & syrup', name_ar: 'خبز فرنسي محمص مع التوت والشراب', kcals: 204 },
      ],
      lunch: [
        { name: 'Garlic Parmesan Chicken Spaghetti', name_ar: 'سباجيتي الدجاج بالثوم والبارميزان', kcals: 182 },
        { name: 'Grilled fish with dill rice', name_ar: 'سمك مشوي مع أرز بالشبت', kcals: 167 },
        { name: 'Chicken mashkhool', name_ar: 'دجاج مشوي', kcals: 173 },
        { name: 'Subway chicken salad', name_ar: 'سلطة دجاج صب واي', kcals: 140 },
      ],
      dinner: [
        { name: 'Chicken Club sandwich', name_ar: 'ساندويتش دجاج كلوب', kcals: 170 },
        { name: 'Pomegranate beef burger', name_ar: 'برجر لحم بقري بالرمان', kcals: 190 },
        { name: 'Tenderloin steak with mashed potatoes', name_ar: 'ستيك تندرلوين مع بطاطا مهروسة', kcals: 197 },
        { name: 'Chicken tawook fattoush salad', name_ar: 'سلطة فتوش دجاج طاووق', kcals: 113 },
      ],
      snacks: [
        { name: 'Lazy cake bar', name_ar: 'ليزي كيك بار', kcals: 260 },
        { name: 'Watermelon feta salad', name_ar: 'سلطة بطيخ بالفيتا', kcals: 120 },
        { name: 'Oats and berries', name_ar: 'شوفان مع التوت', kcals: 180 },
        { name: 'Cream of mushroom soup', name_ar: 'شوربة كريمة الفطر', kcals: 90 },
      ],
    },
  },
  {
    day: 'Thursday', short: 'Thu', week: 1, collection: 'summer',
    items: {
      breakfast: [
        { name: 'Egg N\' HashBrown wrap', name_ar: 'راب بيض وبطاطا مقلية', kcals: 210 },
        { name: 'Grilled halloumi zaatar croissant', name_ar: 'كرواسون حلومي مشوي بالزعتر', kcals: 192 },
        { name: 'Chicken salad sandwich', name_ar: 'ساندويتش سلطة دجاج', kcals: 170 },
        { name: 'Cinnamon banana pancakes', name_ar: 'فطائر موز بالقرفة', kcals: 189 },
      ],
      lunch: [
        { name: 'Chicken bukhari rice & mint yoghurt', name_ar: 'أرز بخاري دجاج مع زبادي بالنعناع', kcals: 166 },
        { name: 'Shrimp biryani', name_ar: 'برياني روبيان', kcals: 195 },
        { name: 'Shish Tawook with couscous rice', name_ar: 'دجاج مشوي مع أرز بالكسكس', kcals: 160 },
        { name: 'Chicken Caesar salad', name_ar: 'سلطة سيزر دجاج', kcals: 153 },
      ],
      dinner: [
        { name: 'Creamy spinach chicken pasta', name_ar: 'معكرونة دجاج بالسبانخ الكريمية', kcals: 164 },
        { name: 'Healthy beef tacos', name_ar: 'تاكو لحم صحي', kcals: 172 },
        { name: 'Grilled chicken with mango salsa', name_ar: 'دجاج مشوي مع صلصة مانجو', kcals: 165 },
        { name: 'Grilled Teriyaki Chicken Salad', name_ar: 'سلطة دجاج ترياكي مشوي', kcals: 108 },
      ],
      snacks: [
        { name: 'Pistachio Bon Bon', name_ar: 'حلوى الفستق', kcals: 380 },
        { name: 'Stuffed grape leaves', name_ar: 'ورق عنب محشي', kcals: 112 },
        { name: 'Rocco salad', name_ar: 'سلطة روكا', kcals: 92 },
        { name: 'New York style cheesecake', name_ar: 'تشيز كيك على طريقة نيويورك', kcals: 236 },
      ],
    },
  },
];
