import type { DailyMenu } from '@/types/subscription';

export const WEEKLY_MENU: DailyMenu[] = [
  // --- AUTUMN COLLECTION (Week 1) ---
  {
    day: 'Saturday', short: 'Sat', week: 1, collection: 'autumn',
    items: {
      breakfast: [
        { name: 'Grilled tuna avocado melt', name_ar: 'تونا مشوية مع أفوكادو', kcals: 203, allergens: ['Fish', 'Dairy'] },
        { name: 'Cheese & broccoli omelette', name_ar: 'أومليت بالجبنة والبروكلي', kcals: 186, allergens: ['Eggs', 'Dairy'] },
        { name: 'Spanish omelette', name_ar: 'أومليت إسباني', kcals: 160, allergens: ['Eggs'] },
        { name: 'Grilled halloumi & zaatar Croissant', name_ar: 'كرواسون حلوم مشوي وزعتر', kcals: 192, allergens: ['Dairy', 'Gluten'] },
      ],
      lunch: [
        { name: 'Shawarma chicken with beetroot rice', name_ar: 'شاورما دجاج مع أرز بالبنجر', kcals: 149 },
        { name: 'Shrimp biryani', name_ar: 'برياني روبيان', kcals: 163, allergens: ['Seafood'] },
        { name: 'Creamy beef & Mushroom pasta', name_ar: 'باستا لحم وفطر بالكريمة', kcals: 179, allergens: ['Dairy', 'Gluten'] },
        { name: 'Chicken beetroot salad', name_ar: 'سلطة دجاج بالبنجر', kcals: 127 },
      ],
      dinner: [
        { name: 'Tandoori chicken with couscous rice', name_ar: 'دجاج تندوري مع أرز كسكس', kcals: 174, allergens: ['Gluten'] },
        { name: 'Saffron chicken risotto', name_ar: 'ريزوتو دجاج بالزعفران', kcals: 173, allergens: ['Dairy'] },
        { name: 'Swedish meat balls and mash potatoes', name_ar: 'كرات لحم سويدية وبطاطس مهروسة', kcals: 180, allergens: ['Dairy'] },
        { name: 'Crunchy chicken tahini salad', name_ar: 'سلطة دجاج مقرمشة بالطحينة', kcals: 148, allergens: ['Sesame'] },
      ],
      snacks: [
        { name: 'Saffron vermicelli pudding', name_ar: 'بلاليط بالزعفران', kcals: 244, allergens: ['Dairy'] },
        { name: 'Cream of broccoli soup', name_ar: 'شوربة بروكلي بالكريمة', kcals: 56, allergens: ['Dairy'] },
        { name: 'Keto cinnamon bombs', name_ar: 'كرات القرفة كيتو', kcals: 245, allergens: ['Dairy', 'Nuts'] },
        { name: 'Açai berry bowl', name_ar: 'وعاء آساي بالتوت', kcals: 220 },
      ],
    },
  },
  {
    day: 'Sunday', short: 'Sun', week: 1, collection: 'autumn',
    items: {
      breakfast: [
        { name: 'English breakfast', name_ar: 'إفطار إنجليزي', kcals: 163, allergens: ['Eggs', 'Gluten'] },
        { name: 'Mushroom omelette with toast', name_ar: 'أومليت بالفطر مع خبز محمص', kcals: 180, allergens: ['Eggs', 'Gluten'] },
        { name: 'Pesto chicken breakfast wrap', name_ar: 'راب إفطار دجاج بيستو', kcals: 207, allergens: ['Gluten'] },
        { name: 'Egg salad sandwich', name_ar: 'ساندويتش سلطة البيض', kcals: 212, allergens: ['Eggs', 'Gluten'] },
      ],
      lunch: [
        { name: 'Chicken majboos with mint yoghurt', name_ar: 'مجبوس دجاج بالزبادي بالنعناع', kcals: 164, isHeritage: true },
        { name: 'Beef steak with mash & grilled veggies', name_ar: 'ستيك لحم بقري مع مهروس وخضار', kcals: 197 },
        { name: 'Spaghetti Bolognese', name_ar: 'سباجيتي بولونيز', kcals: 178, allergens: ['Gluten'] },
        { name: 'Grilled chicken Greek salad', name_ar: 'سلطة يونانية بالدجاج المشوي', kcals: 118 },
      ],
      dinner: [
        { name: 'Chicken pesto fettuccine', name_ar: 'فيتوتشيني الدجاج بالبيستو', kcals: 184, allergens: ['Dairy', 'Gluten'] },
        { name: 'Baked salmon with kidney bean rice', name_ar: 'سمك سلمون مخبوز مع أرز بالفاصوليا', kcals: 163, allergens: ['Fish'] },
        { name: 'Chipotle chicken burger', name_ar: 'برجر دجاج شيبوتل', kcals: 182, allergens: ['Gluten'] },
        { name: 'Spinach chicken salad', name_ar: 'سلطة الدجاج بالسبانخ', kcals: 134 },
      ],
      snacks: [
        { name: 'Rocca salad', name_ar: 'سلطة جرجير', kcals: 80 },
        { name: 'Chicken noodle soup', name_ar: 'حساء الدجاج بالشعيرية', kcals: 53, allergens: ['Gluten'] },
        { name: 'Raspberry Chia Pudding', name_ar: 'بودينج التوت الشيا', kcals: 110, allergens: ['Dairy'] },
        { name: 'Triangle fruit salad', name_ar: 'سلطة فواكه مثلثة', kcals: 94 },
      ],
    },
  },

  // --- WEEK 2 ---
  {
    day: 'Saturday', short: 'Sat', week: 2, collection: 'autumn',
    items: {
      breakfast: [
        { name: 'Tuna avocado sandwich with capers', name_ar: 'ساندوتش تونا أفوكادو', kcals: 203, allergens: ['Fish', 'Gluten'] },
        { name: 'Pesto chicken breakfast wrap', name_ar: 'راب إفطار دجاج بيستو', kcals: 207, allergens: ['Gluten'] },
        { name: 'Guacamole turkey & egg sandwich', name_ar: 'ساندوتش تركي وبيض مع جواكامولي', kcals: 180, allergens: ['Eggs', 'Gluten'] },
        { name: 'Egg salad sandwich', name_ar: 'ساندويتش سلطة البيض', kcals: 212, allergens: ['Eggs', 'Gluten'] },
      ],
      lunch: [
        { name: 'Peri peri chicken and rice', name_ar: 'دجاج بيري بيري مع أرز', kcals: 165 },
        { name: 'Shrimp biryani', name_ar: 'برياني روبيان', kcals: 163, allergens: ['Seafood'] },
        { name: 'Creamy beef & mushroom pasta', name_ar: 'باستا لحم وفطر بالكريمة', kcals: 179, allergens: ['Dairy', 'Gluten'] },
        { name: 'Mediterranean chicken salad', name_ar: 'سلطة دجاج متوسطية', kcals: 133 },
      ],
      dinner: [
        { name: 'Chicken Club sandwich', name_ar: 'ساندوتش كلوب دجاج', kcals: 170, allergens: ['Gluten'] },
        { name: 'Mongolian beef rice bowl', name_ar: 'وعاء أرز لحم منغولي', kcals: 168 },
        { name: 'Saffron chicken risotto', name_ar: 'ريزوتو دجاج بالزعفران', kcals: 173, allergens: ['Dairy'] },
        { name: 'Crunchy chicken tahini salad', name_ar: 'سلطة دجاج مقرمشة بالطحينة', kcals: 148, allergens: ['Sesame'] },
      ],
      snacks: [
        { name: 'Triangle fruit salad', name_ar: 'سلطة فواكه مثلثة', kcals: 94 },
        { name: 'Crunchy cabbage salad', name_ar: 'سلطة ملفوف مقرمشة', kcals: 90 },
        { name: 'Celery & carrot soup', name_ar: 'حساء الكرفس والجزر', kcals: 75 },
        { name: 'Açai berry bowl', name_ar: 'وعاء آساي بالتوت', kcals: 220 },
      ],
    },
  },
  {
    day: 'Sunday', short: 'Sun', week: 2, collection: 'autumn',
    items: {
      breakfast: [
        { name: 'Peanut butter oats', name_ar: 'شوفان بزبدة الفول السوداني', kcals: 236, allergens: ['Nuts'] },
        { name: 'Spinach mushroom & cheese omelette', name_ar: 'أومليت سبانخ وفطر وجبن', kcals: 187, allergens: ['Eggs', 'Dairy'] },
        { name: 'Eggplant omlette sandwich', name_ar: 'ساندوتش أومليت باذنجان', kcals: 168, allergens: ['Eggs', 'Gluten'] },
        { name: 'Grilled halloumi & zaatar Croissant', name_ar: 'كرواسون حلوم مشوي وزعتر', kcals: 192, allergens: ['Dairy', 'Gluten'] },
      ],
      lunch: [
        { name: 'Shawarama chicken with Beetroot Rice', name_ar: 'شاورما دجاج مع أرز بالبنجر', kcals: 149 },
        { name: 'Beef steak with mash & grilled veggies', name_ar: 'ستيك لحم بقري مع مهروس وخضار', kcals: 197 },
        { name: 'Chicken pesto fettuccine', name_ar: 'فيتوتشيني الدجاج بالبيستو', kcals: 184, allergens: ['Dairy', 'Gluten'] },
        { name: 'Grilled chicken Greek salad', name_ar: 'سلطة يونانية بالدجاج المشوي', kcals: 118 },
      ],
      dinner: [
        { name: 'Chicken tikka with couscous rice', name_ar: 'دجاج تيكا مع أرز الكسكس', kcals: 174, allergens: ['Gluten'] },
        { name: 'Baked salmon keto bowl', name_ar: 'وعاء كيتو سلمون مخبوز', kcals: 166, allergens: ['Fish'] },
        { name: 'Caramelized onion beef burger', name_ar: 'برجر لحم بقري بالبصل المكرمل', kcals: 205, allergens: ['Gluten'] },
        { name: 'Spinach chicken salad', name_ar: 'سلطة الدجاج بالسبانخ', kcals: 134 },
      ],
      snacks: [
        { name: 'Sunflower seed energy bites', name_ar: 'بذور دوار الشمس كرات الطاقة', kcals: 380, allergens: ['Nuts'] },
        { name: 'Chicken & corn soup', name_ar: 'حساء الدجاج والذرة', kcals: 72 },
        { name: 'Tiramisu cake', name_ar: 'كعكة التيراميسو', kcals: 280, allergens: ['Dairy', 'Gluten'] },
        { name: 'Overnight oats', name_ar: 'شوفان منقوع طوال الليل', kcals: 202 },
      ],
    },
  },

  // --- WEEK 3 ---
  {
    day: 'Saturday', short: 'Sat', week: 3, collection: 'autumn',
    items: {
      breakfast: [
        { name: 'Muhammara Chicken Sandwich', name_ar: 'ساندويتش دجاج محمرة', kcals: 170, allergens: ['Gluten', 'Nuts'] },
        { name: 'Cheese & broccoli omelette', name_ar: 'أومليت الجبن والبروكلي', kcals: 186, allergens: ['Eggs', 'Dairy'] },
        { name: 'Grilled halloumi sandwich', name_ar: 'ساندويتش حلوم مشوي', kcals: 180, allergens: ['Dairy', 'Gluten'] },
        { name: 'Sweet potato pancakes', name_ar: 'فطائر البطاطا الحلوة', kcals: 164, allergens: ['Eggs'] },
      ],
      lunch: [
        { name: 'Spinach chicken risotto', name_ar: 'ريزوتو الدجاج بالسبانخ', kcals: 183, allergens: ['Dairy'] },
        { name: 'Creamy meatballs with dill rice', name_ar: 'كرات لحم كريمية مع أرز بالشبنت', kcals: 180, allergens: ['Dairy'] },
        { name: 'Butter chicken with saffron rice', name_ar: 'دجاج بالزبدة مع أرز بالزعفران', kcals: 178, allergens: ['Dairy'] },
        { name: 'Chicken beetroot salad', name_ar: 'سلطة دجاج بالبنجر', kcals: 127 },
      ],
      dinner: [
        { name: 'Chicken & smoked turkey sandwich', name_ar: 'ساندويتش دجاج وديك رومي مدخن', kcals: 174, allergens: ['Gluten'] },
        { name: 'Spicy shrimp rose pasta', name_ar: 'باستا الروبيان روز الحارة', kcals: 185, allergens: ['Seafood', 'Dairy', 'Gluten'] },
        { name: 'Healthy beef tacos', name_ar: 'تاكو لحم بقري صحي', kcals: 172, allergens: ['Gluten'] },
        { name: 'Crunchy chicken tahini salad', name_ar: 'سلطة دجاج مقرمشة بالطحينة', kcals: 148, allergens: ['Sesame'] },
      ],
      snacks: [
        { name: 'Saffron vermicelli pudding', name_ar: 'بلاليط بالزعفران', kcals: 244, allergens: ['Dairy'] },
        { name: 'Carrot and celery soup', name_ar: 'شوربة جزر وكرفس', kcals: 75 },
        { name: 'Dark chocolate granola bars', name_ar: 'ألواح جرانولا الشوكولاتة الداكنة', kcals: 280, allergens: ['Nuts', 'Gluten'] },
        { name: 'Açai berry bowl', name_ar: 'وعاء آساي بالتوت', kcals: 220 },
      ],
    },
  },

  // --- WEEK 4 ---
  {
    day: 'Saturday', short: 'Sat', week: 4, collection: 'autumn',
    items: {
      breakfast: [
        { name: 'Chicken salad croissant sandwich', name_ar: 'ساندويتش كرواسون سلطة الدجاج', kcals: 220, allergens: ['Gluten', 'Dairy'] },
        { name: 'Mushroom egg and cheese sandwich', name_ar: 'ساندويتش بيض بالفطر والجبن', kcals: 180, allergens: ['Eggs', 'Dairy', 'Gluten'] },
        { name: 'Grilled halloumi sandwich', name_ar: 'ساندويتش حلوم مشوي', kcals: 180, allergens: ['Dairy', 'Gluten'] },
        { name: 'Healthy berry pancakes', name_ar: 'فطائر التوت الصحية', kcals: 185, allergens: ['Eggs'] },
      ],
      lunch: [
        { name: 'Stuffed Chicken Breast with white rice', name_ar: 'صدر دجاج محشو مع أرز أبيض', kcals: 153, allergens: ['Dairy'] },
        { name: 'Creamy beef & mushroom pasta', name_ar: 'باستا لحم وفطر بالكريمة', kcals: 179, allergens: ['Dairy', 'Gluten'] },
        { name: 'Butter chicken with saffron rice', name_ar: 'دجاج بالزبدة مع أرز بالزعفران', kcals: 178, allergens: ['Dairy'] },
        { name: 'Chicken beetroot salad', name_ar: 'سلطة دجاج بالبنجر', kcals: 127 },
      ],
      dinner: [
        { name: 'Chicken BLT sandwich', name_ar: 'ساندويتش دجاج بي إل تي', kcals: 200, allergens: ['Gluten'] },
        { name: 'Spicy shrimp rose pasta', name_ar: 'باستا الروبيان روز الحارة', kcals: 185, allergens: ['Seafood', 'Dairy', 'Gluten'] },
        { name: 'Tandoori chicken with couscous rice', name_ar: 'دجاج تندوري مع أرز الكسكس', kcals: 174, allergens: ['Gluten'] },
        { name: 'Crunchy chicken tahini salad', name_ar: 'سلطة دجاج مقرمشة بالطحينة', kcals: 148, allergens: ['Sesame'] },
      ],
      snacks: [
        { name: 'Chocolate dipped date', name_ar: 'تمر مغطى بالشوكولاتة', kcals: 244 },
        { name: 'Carrot and celery soup', name_ar: 'شوربة جزر وكرفس', kcals: 75 },
        { name: 'Green salad', name_ar: 'سلطة خضراء', kcals: 280 },
        { name: 'Overnight oats', name_ar: 'شوفان منقوع', kcals: 202, allergens: ['Dairy'] },
      ],
    },
  },

  // --- RAMADAN COLLECTION (Full 7 Days) ---
  {
    day: 'Saturday', short: 'Sat', week: 1, collection: 'ramadan',
    items: {
      breakfast: [ // Suhoor
        { name: 'Chicken & bacon avocado wrap', name_ar: 'لفافة دجاج وبيكون وأفوكادو', kcals: 156, allergens: ['Gluten'] },
        { name: 'Roasted pumpkin egg sandwich', name_ar: 'ساندوتش بيض ويقطين محمص', kcals: 164, allergens: ['Eggs', 'Gluten'] },
        { name: 'Mix berry croissant', name_ar: 'كرواسون توت مشكل', kcals: 230, allergens: ['Dairy', 'Gluten'] },
        { name: 'Peanut butter oats', name_ar: 'شوفان بزبدة الفول السوداني', kcals: 236, allergens: ['Nuts'] },
      ],
      lunch: [ // Iftar
        { name: 'Chicken majboos with rob khiyar', name_ar: 'مجبوس دجاج مع روب خيار', kcals: 166, isHeritage: true, allergens: ['Dairy'] },
        { name: 'Beef Bamia with vermicelli rice', name_ar: 'بامية لحم مع أرز شعيرية', kcals: 170, allergens: ['Gluten'] },
        { name: 'Penne chicken Alfredo', name_ar: 'بيني دجاج ألفريدو', kcals: 180, allergens: ['Dairy', 'Gluten'] },
        { name: 'Quinoa berry chicken salad', name_ar: 'سلطة دجاج بالكينوا والتوت', kcals: 130 },
      ],
      dinner: [ // Night meal
        { name: 'Pesto chicken sandwich', name_ar: 'ساندوتش دجاج بالبيستو', kcals: 220, allergens: ['Dairy', 'Gluten', 'Nuts'] },
        { name: 'Spicy shrimp rose pasta', name_ar: 'باستا روبيان روز حارة', kcals: 185, allergens: ['Seafood', 'Dairy', 'Gluten'] },
        { name: 'Swedish chicken balls', name_ar: 'كرات دجاج سويدية', kcals: 180, allergens: ['Dairy', 'Gluten'] },
        { name: 'Crunchy chicken tahini salad', name_ar: 'سلطة دجاج مقرمشة بالطحينة', kcals: 148, allergens: ['Sesame'] },
      ],
      snacks: [
        { name: 'Saffron vermicelli pudding', name_ar: 'بلاليط بالزعفران', kcals: 244, allergens: ['Dairy'] },
        { name: 'Orange salad', name_ar: 'سلطة برتقال', kcals: 78 },
        { name: 'Acai berry bowl', name_ar: 'وعاء آساي بالتوت', kcals: 220 },
        { name: 'Energy date balls', name_ar: 'كرات طاقة بالتمر', kcals: 168, allergens: ['Nuts'] },
      ],
    },
  },
];
