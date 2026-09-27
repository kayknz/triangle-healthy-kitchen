const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
const realDataMode=window.THK_APP_CONFIG?.dataMode==='real';
const demoFallbackEnabled=()=>!!window.THK_API?.preserveDemoFallback;
let backendPendingCustomerCache=[];
const state={role:null,module:'dashboard',customerPhone:null,bmiReportPreview:null,regOtp:{phone:'',sent:false,verified:false,code:'',verificationToken:'',verifiedAt:''},regPlanPayment:null};
const contactNumbers={support:'97466655759',boss:'97466624942'};
function openWhatsApp(number,message=''){const text=message?'?text='+encodeURIComponent(message):'';window.open('https://wa.me/'+number+text,'_blank','noopener')}
let currentLang=localStorage.getItem('triangleCustomerLang')||'en';
const i18nStore={en:{text:{},attr:{}},ar:{text:{},attr:{}}};
const builtInArText={
  'English':'\u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629',
  'Triangle':'\u062A\u0631\u0627\u064A\u0646\u062C\u0644',
  'Healthy Kitchen':'\u0647\u064A\u0644\u062B\u064A \u0643\u064A\u062A\u0634\u0646',
  'Customer Portal':'\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0639\u0645\u064A\u0644',
  'Create Account':'\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628',
  'Welcome to the Triangle family':'\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A \u0639\u0627\u0626\u0644\u0629 \u062A\u0631\u0627\u064A\u0646\u062C\u0644',
  "We'll ask a few simple questions to prepare the right plan for you.":'\u0633\u0646\u0637\u0631\u062D \u0639\u0644\u064A\u0643 \u0628\u0639\u0636 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0628\u0633\u064A\u0637\u0629 \u0644\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0643.',
  'Your information is private and secure.':'\u0645\u0639\u0644\u0648\u0645\u0627\u062A\u0643 \u062E\u0627\u0635\u0629 \u0648\u0622\u0645\u0646\u0629.',
  'Explore Menu':'\u0627\u0633\u062A\u0643\u0634\u0641 \u0627\u0644\u0645\u0646\u064A\u0648',
  "Let's Get Started":'\u0644\u0646\u0628\u062F\u0623',
  'It only takes 2 minutes':'\u064A\u0633\u062A\u063A\u0631\u0642 \u062F\u0642\u064A\u0642\u062A\u064A\u0646 \u0641\u0642\u0637',
  'Reset':'\u0625\u0639\u0627\u062F\u0629',
  'Registration page reset':'\u062A\u0645 \u0625\u0639\u0627\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0633\u062C\u064A\u0644',
  'Account Login':'\u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0627\u0644\u0641\u0631\u064A\u0642',
  'Account':'\u0627\u0644\u062D\u0633\u0627\u0628',
  'Open Dashboard':'\u0641\u062A\u062D \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645',
  'Team Login':'\u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0627\u0644\u0641\u0631\u064A\u0642',
  'Reset registration':'\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0633\u062C\u064A\u0644',
  'Back':'\u0631\u062C\u0648\u0639',
  'Home':'\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629',
  'SMS Verification':'\u062A\u062D\u0642\u0642 \u0639\u0628\u0631 SMS',
  'Verify your mobile number before continuing.':'\u062A\u062D\u0642\u0642 \u0645\u0646 \u0631\u0642\u0645 \u0627\u0644\u062C\u0648\u0627\u0644 \u0642\u0628\u0644 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629.',
  'Verification Code':'\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642',
  'Send Code':'\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0645\u0632',
  'Verify':'\u062A\u062D\u0642\u0642',
  'Send a code to verify this mobile number.':'\u0623\u0631\u0633\u0644 \u0631\u0645\u0632\u0627\u064B \u0644\u062A\u062D\u0642\u064A\u0642 \u0631\u0642\u0645 \u0627\u0644\u062C\u0648\u0627\u0644.',
  'Demo SMS code sent. Enter 123456.':'\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u062A\u062C\u0631\u064A\u0628\u064A. \u0623\u062F\u062E\u0644 123456.',
  'Mobile number verified.':'\u062A\u0645 \u062A\u062D\u0642\u064A\u0642 \u0631\u0642\u0645 \u0627\u0644\u062C\u0648\u0627\u0644.',
  'Please verify your mobile number before continuing.':'\u064A\u0631\u062C\u0649 \u062A\u062D\u0642\u064A\u0642 \u0631\u0642\u0645 \u0627\u0644\u062C\u0648\u0627\u0644 \u0642\u0628\u0644 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629.',
  'Please verify your mobile number first':'\u064A\u0631\u062C\u0649 \u062A\u062D\u0642\u064A\u0642 \u0631\u0642\u0645 \u0627\u0644\u062C\u0648\u0627\u0644 \u0623\u0648\u0644\u0627\u064B',
  'Phone changed. Please send a new code.':'\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0631\u0642\u0645. \u064A\u0631\u062C\u0649 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u062C\u062F\u064A\u062F.',
  'Incorrect code. Please check and try again.':'\u0627\u0644\u0631\u0645\u0632 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u062D\u0642\u0642 \u0648\u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.',
  'Step 1 of 11':'\u0627\u0644\u062E\u0637\u0648\u0629 1 \u0645\u0646 11'
};
function customerI18nRoots(){return ['#loginScreen','.customer-app','#toast'].map(sel=>$(sel)).filter(Boolean)}
async function loadI18nFiles(){try{const [en,ar]=await Promise.all([fetch('en.json').then(r=>r.json()),fetch('ar.json').then(r=>r.json())]);Object.assign(i18nStore.en,en);Object.assign(i18nStore.ar,ar)}catch(e){console.warn('Language files not loaded',e)}applyI18n()}
function i18nTextMap(){return i18nStore[currentLang]?.text||{}}
function i18nAttrMap(){return i18nStore[currentLang]?.attr||{}}
function tr(text){const key=String(text??'').trim();return i18nTextMap()[key]||key}
function trSmart(text){const raw=String(text??'');const trimmed=raw.trim();if(!trimmed)return raw;let translated=i18nTextMap()[trimmed];if(!translated&&currentLang==='ar'){
  translated=builtInArText[trimmed]||translated;
}
if(!translated&&currentLang==='ar'){
  translated=trimmed
    .replace(/^Step (\d+) of (\d+)$/,'?????? $1 ?? $2')
    .replace(/^Week (\d+)$/,'??????? $1')
    .replace(/^Option (\d+)$/,'?????? $1')
    .replace(/^Category ([A-Z]+)$/,'????? $1')
    .replace(/^(\d+) Days Left$/,'???? $1 ???')
    .replace(/^(\d+) Completed$/,'?? ?????? $1')
    .replace(/^within (.+)$/,'??? $1')
    .replace(/^Expires on (.+)$/,'????? ?? $1')
    .replace(/^Good Morning, (.+)!$/,'???? ?????? $1!');
}
return raw.replace(trimmed,translated||trimmed)}
function applyI18n(root=document){
  document.documentElement.lang=currentLang;document.documentElement.dir=currentLang==='ar'?'rtl':'ltr';
  $$('[data-lang-switch]').forEach(btn=>btn.classList.toggle('active',btn.dataset.langSwitch===currentLang));
  const attrMap=i18nAttrMap();
  const roots=root===document?customerI18nRoots():(root?[root]:[]);
  roots.forEach(scope=>{
    scope.querySelectorAll('input,textarea').forEach(el=>{if(el.placeholder){el.dataset.i18nPlaceholder=el.dataset.i18nPlaceholder||el.placeholder;el.placeholder=attrMap[el.dataset.i18nPlaceholder]||trSmart(el.dataset.i18nPlaceholder)}});
    scope.querySelectorAll('[aria-label],[title],[alt]').forEach(el=>['aria-label','title','alt'].forEach(attr=>{const value=el.getAttribute(attr);if(!value)return;const key='i18n'+attr.replace(/[^a-z]/gi,'');el.dataset[key]=el.dataset[key]||value;el.setAttribute(attr,attrMap[el.dataset[key]]||trSmart(el.dataset[key]))}));
    scope.querySelectorAll('option').forEach(el=>{const original=el.dataset.i18nText||el.textContent.trim();el.dataset.i18nText=original;if(!el.value)el.value=original;el.textContent=trSmart(original)});
    const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT,{acceptNode(node){if(!node.nodeValue.trim())return NodeFilter.FILTER_REJECT;const p=node.parentElement;if(!p||['SCRIPT','STYLE','TEXTAREA','OPTION'].includes(p.tagName))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT}});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{node.__i18nSource=node.__i18nSource||node.nodeValue;node.nodeValue=trSmart(node.__i18nSource)});
  });
}
function setCustomerLanguage(lang){currentLang=lang==='ar'?'ar':'en';localStorage.setItem('triangleCustomerLang',currentLang);applyI18n();if(state.role==='customer')renderPortal()}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-lang-switch]');if(!btn)return;if(state.role&&state.role!=='customer'){forceAdminEnglish();toast('CEO/Admin review stays in English');return}setCustomerLanguage(btn.dataset.langSwitch);syncRegisterHeaderAction()});
function forceAdminEnglish(){currentLang='en';document.documentElement.lang='en';document.documentElement.dir='ltr';applyI18n($('#loginScreen')||document);$$('[data-lang-switch]').forEach(btn=>btn.classList.toggle('active',btn.dataset.langSwitch==='en'))}
const roles={boss:{label:'CEO',password:'THKceo@2026',hint:'Full access',allow:'all',edit:true},admin:{label:'Admin',password:'THKadmin@2026',hint:'Full access',allow:'all',edit:true},transport:{label:'Transportation Manager',password:'THKtransport@2026',hint:'Delivery and driver assignment',allow:['dashboard','delivery','drivers','settings'],edit:false},kitchen:{label:'Kitchen Team',password:'THKkitchen@2026',hint:'Kitchen, packing and reports only',allow:['dashboard','kitchen','packing','mealplans','reports','settings'],edit:false},driver:{label:'Drivers Team',password:'THKdriver@2026',hint:'Delivery locations only',allow:['dashboard','delivery','drivers','settings'],edit:false},customer:{label:'Customer',password:'',hint:'Customer portal only',allow:['portal'],edit:false}};
const staffPasswordAliases={boss:['boss123'],admin:['admin123'],transport:['transport123'],kitchen:['kitchen123'],driver:['driver123']};
function normalizeStaffRole(value){
  const key=String(value||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
  return {ceo:'boss',boss:'boss',admin:'admin',transport:'transport',transportation:'transport',transportation_manager:'transport',kitchen:'kitchen',kitchen_team:'kitchen',driver:'driver',drivers:'driver',driver_team:'driver',drivers_team:'driver'}[key]||key;
}
function validStaffPassword(roleKey,passValue){
  const pass=String(passValue||'').trim();
  const account=roles[roleKey];
  return !!pass&&!!account&&(pass===String(account.password||'')||(staffPasswordAliases[roleKey]||[]).includes(pass));
}
function setStaffLoginLoading(isLoading){
  const btn=$('#loginSubmitBtn')||document.querySelector('#loginForm button[type="submit"]');
  if(!btn)return;
  btn.disabled=!!isLoading;
  btn.textContent=isLoading?'Opening Dashboard...':'Open Dashboard';
}
const mealCategories=[['A',150,120,'Standard category'],['B',200,200,'High protein and high carbs'],['C',200,150,'High protein balanced carbs'],['D',200,100,'High protein low carbs'],['E',170,150,'Medium protein balanced carbs'],['F',150,100,'Light protein low carbs']];
const mealSelectionPackages=[
 {id:'2m1s',label:'2 Meals + 1 Snack',price:1700,mealCount:2,meals:['Lunch','Dinner'],snacks:1},
 {id:'3m',label:'3 Meals',price:2000,mealCount:3,meals:['Breakfast','Lunch','Dinner'],snacks:0},
 {id:'3m1s',label:'3 Meals + 1 Snack',price:2200,mealCount:3,meals:['Breakfast','Lunch','Dinner'],snacks:1},
 {id:'3m2s',label:'3 Meals + 2 Snacks',price:2400,mealCount:3,meals:['Breakfast','Lunch','Dinner'],snacks:2},
 {id:'4m',label:'4 Meals',price:2600,mealCount:4,meals:['Breakfast','Lunch','Dinner'],snacks:0},
 {id:'4m1s',label:'4 Meals + 1 Snack',price:2800,mealCount:4,meals:['Breakfast','Lunch','Dinner'],snacks:1},
 {id:'4m2s',label:'4 Meals + 2 Snacks',price:3000,mealCount:4,meals:['Breakfast','Lunch','Dinner'],snacks:2},
 {id:'custom',label:'Custom Meals + Custom Snacks',price:null,mealCount:0,meals:['Breakfast','Lunch','Dinner'],snacks:0,custom:true}
];
function defaultWeekSelections(){return [0,1,2,3].map(i=>({week:i+1,days:{Saturday:true,Sunday:true,Monday:true,Tuesday:true,Wednesday:true,Thursday:true,Friday:false},menuItems:{},menuOptions:{},dayMenuOptions:{},fridayOptions:{},notes:''}))}
function menuMealTypeFromSlot(slot){const text=String(slot||'');if(/extra meal/i.test(text))return 'Extra Meal';if(/snack/i.test(text))return 'Snacks';if(/breakfast/i.test(text))return 'Breakfast';if(/dinner/i.test(text))return 'Dinner';return 'Lunch'}
function registrationMenuSelectionsToWeeks(planPayment,existingWeeks){
  const weeks=(Array.isArray(existingWeeks)&&existingWeeks.length?existingWeeks:defaultWeekSelections()).map(w=>({...w,days:{...(w.days||{})},menuOptions:{...(w.menuOptions||{})},dayMenuOptions:{...(w.dayMenuOptions||{})},fridayOptions:{...(w.fridayOptions||{})}}));
  if(Array.isArray(planPayment?.selectedDeliveryDays)&&planPayment.selectedDeliveryDays.length){
    weeks.forEach(week=>{
      allWeekDays().forEach(day=>{week.days[day]=planPayment.selectedDeliveryDays.includes(day)});
    });
  }
  const selections=Array.isArray(planPayment?.menuSelections)?planPayment.menuSelections:[];
  selections.forEach((dayItem,dayIndex)=>{
    const week=weeks[0]||defaultWeekSelections()[0];
    const fridayPackage=/friday package/i.test(String(dayItem.day||''));
    const dayName=fridayPackage?'Friday':regMenuDayName(dayItem.day);
    if(!week.dayMenuOptions)week.dayMenuOptions={};
    if(!week.dayMenuOptions[dayName])week.dayMenuOptions[dayName]={};
    const optionTarget=fridayPackage?week.fridayOptions:week.dayMenuOptions[dayName];
    (dayItem.items||[]).forEach(item=>{
      const meal=String(item.meal||'').trim();
      if(!meal||meal==='Kitchen Choice')return;
      const type=menuMealTypeFromSlot(item.slot);
      if(type==='Snacks'){
        const list=Array.isArray(optionTarget.Snacks)?optionTarget.Snacks.slice():(optionTarget.Snacks?[optionTarget.Snacks]:[]);
        if(!list.includes(meal))list.push(meal);
        optionTarget.Snacks=list;
        return;
      }
      if(!optionTarget[type]||optionTarget[type]==='Kitchen Choice')optionTarget[type]=meal;
    });
  });
  const firstDay=Object.keys(weeks[0].dayMenuOptions||{})[0];
  if(firstDay&&!Object.keys(weeks[0].menuOptions||{}).length)weeks[0].menuOptions={...(weeks[0].dayMenuOptions[firstDay]||{})};
  return weeks;
}
function packageById(id){return mealSelectionPackages.find(p=>p.id===id)||mealSelectionPackages[0]}
function packageIncludesFriday(id){return id==='custom30' || String(id||'').includes('friday')}
function mealTicksForPackage(id){const p=packageById(id);return {Breakfast:p.meals.includes('Breakfast'),Lunch:p.meals.includes('Lunch'),Dinner:p.meals.includes('Dinner'),Snack1:p.snacks>=1,Snack2:p.snacks>=2}}
function mealTickLabels(){return [['Breakfast','Breakfast'],['Lunch','Lunch'],['Dinner','Dinner'],['Snack1','Snack 1'],['Snack2','Snack 2']]}
function menuItemsForSlot(slot){const type=slot.startsWith('Snack')?'Snacks':slot;return Object.values(weeklyMenu).flatMap(day=>day[type]||[])}
function menuSlotOptions(slot,selected){return menuItemsForSlot(slot).map(item=>'<option '+(item===selected?'selected':'')+'>'+item+'</option>').join('')}
function selectedMenuItem(slot,week,item){return item||menuItemsForSlot(slot)[(Number(week||1)-1)%Math.max(menuItemsForSlot(slot).length,1)]||'-'}
function selectedSlotsForPackage(id){return Object.entries(mealTicksForPackage(id)).filter(([,v])=>v).map(([k])=>k)}
function mealTypeFromSlot(slot){return slot.startsWith('Snack')?'Snacks':slot}
function optionItemsForMeal(type,dayName='Saturday'){const day=weeklyMenu[dayName]||weeklyMenu.Saturday||Object.values(weeklyMenu)[0];return (day[type]||[]).slice(0,4)}
function selectedOptionLabel(type,index,dayName='Saturday'){return optionItemsForMeal(type,dayName)[Number(index)-1]||('Option '+index)}
function customerHasFriday(c){return (Array.isArray(c?.selectedDeliveryDays)&&c.selectedDeliveryDays.includes('Friday')) || !!c?.includeFriday || packageIncludesFriday(c?.mealPackageId)}
function packageLimits(id){const p=packageById(id);return {meals:p.mealCount??p.meals.length,snacks:p.snacks,label:p.label,price:p.price,custom:!!p.custom}}
function packagePriceLabel(id){const p=packageById(id);return p.custom?'CEO/Admin will confirm custom price':money(p.price)}
function packagePlanName(id){const p=packageById(id);return p.custom?'Custom Package':p.price+' QTR Package'}
function recommendMealPackage(calories){
  const value=Number(calories||0);
  if(!value)return {packageName:'Pending calorie calculation',meals:null,snacks:null,custom:false,pending:true,mealPackageId:'3m1s',maxCalories:0};
  if(value<=1300)return {packageName:'2 Meals + 1 Snack',meals:2,snacks:1,custom:false,mealPackageId:'2m1s',maxCalories:1300};
  if(value<=1500)return {packageName:'3 Meals',meals:3,snacks:0,custom:false,mealPackageId:'3m',maxCalories:1500};
  if(value<=1800)return {packageName:'3 Meals + 1 Snack',meals:3,snacks:1,custom:false,mealPackageId:'3m1s',maxCalories:1800};
  if(value<=2200)return {packageName:'3 Meals + 2 Snacks',meals:3,snacks:2,custom:false,mealPackageId:'3m2s',maxCalories:2200};
  if(value<=2500)return {packageName:'4 Meals + 1 Snack',meals:4,snacks:1,custom:false,mealPackageId:'4m1s',maxCalories:2500};
  if(value<=2600)return {packageName:'4 Main Meals - No Breakfast',meals:4,snacks:0,excludeBreakfast:true,custom:false,mealPackageId:'4m',maxCalories:2600};
  if(value<=2700)return {packageName:'4 Meals + 2 Snacks',meals:4,snacks:2,custom:false,mealPackageId:'4m2s',maxCalories:2700};
  return {packageName:'Custom Package',meals:null,snacks:null,custom:true,requiresAdminReview:true,mealPackageId:'custom',maxCalories:Infinity};
}
function packageRecommendationPayload(){
  const h=regHealthValues();
  const calories=Number(h.nutrition?.systemRecommendedCalories||h.calories||0);
  const rec=recommendMealPackage(calories);
  const selectedId=$('#regMealPackage')?.value||rec.mealPackageId||'3m1s';
  const selected=packageById(selectedId);
  const belowNeed=!!calories&&!selected.custom&&!!rec.maxCalories&&Number(selectedRecommendationLimit(selectedId))<calories;
  return {calories,recommended:rec,selectedPackageId:selectedId,selectedPackageName:selected.label,belowNeed};
}
function selectedRecommendationLimit(id){
  return ({'2m1s':1300,'3m':1500,'3m1s':1800,'3m2s':2200,'4m1s':2500,'4m':2600,'4m2s':2700,custom:Infinity})[id]||0;
}
function selectRecommendedPackage(){
  const payload=packageRecommendationPayload();
  const target=payload.recommended.mealPackageId||'custom';
  const select=$('#regMealPackage');
  if(select){select.value=target;select.dispatchEvent(new Event('change',{bubbles:true}))}
  if(payload.recommended.custom)toast('Custom plan request selected for CEO/Admin review');
  else toast('Recommended package selected');
}
function renderPackageRecommendation(){
  const box=$('#regPackageRecommendation');
  const warn=$('#regPackageWarning');
  if(!box)return;
  const payload=packageRecommendationPayload();
  const rec=payload.recommended;
  if(rec.pending){
    box.innerHTML='<div class="recommendation-empty"><b>Package recommendation</b><span>Complete age, gender, body details, goal and activity level to calculate your recommended package.</span></div>';
    warn?.classList.add('hidden');
    return;
  }
  const isCustom=!!rec.custom;
  const countLine=isCustom?'Manual care-team package':(rec.meals+' meal'+(rec.meals===1?'':'s')+(rec.snacks?(' + '+rec.snacks+' snack'+(rec.snacks===1?'':'s')):''));
  const reason=isCustom?'Your recommended calorie requirement is above our standard package range. Our care team will create a customised meal plan based on your calorie and nutritional requirements.':'This package is recommended based on your calorie requirement, activity level and selected fitness goal.';
  box.innerHTML='<div class="recommendation-head"><span>Recommended for You</span><strong>'+payload.calories+' kcal/day</strong></div><div class="recommendation-body"><div><small>Recommended Package</small><h3>'+escHtml(rec.packageName)+'</h3><p>'+escHtml(reason)+'</p></div><aside><b>'+escHtml(countLine)+'</b><em>'+(rec.excludeBreakfast?'No breakfast included':'Smart calorie range match')+'</em></aside></div><div class="recommendation-actions"><button type="button" class="primary-btn green" data-select-recommended-package>'+(isCustom?'Request Custom Plan':'Select Recommended Package')+'</button><button type="button" class="primary-btn light" data-view-all-packages>View All Available Packages</button></div>';
  if(warn){
    warn.classList.toggle('hidden',!payload.belowNeed);
    warn.innerHTML=payload.belowNeed?'<strong>Package warning</strong><span>The selected package may not fully meet your recommended daily calorie intake. Please consider the recommended package or contact our care team for assistance.</span>':'';
  }
}
function checkedMealGroupCount(card){return ['Breakfast','Lunch','Dinner'].filter(type=>card.querySelector('.option-group[data-type="'+type+'"] input:checked')).length}
function checkedSnackCount(card){return card.querySelectorAll('.option-group[data-type="Snacks"] input:checked').length}
const mealTypeRules={
 Breakfast:{type:'standard',item:'Standard Breakfast',note:'Same portion for all customers'},
 Lunch:{type:'category',item:'Category Lunch',note:'Separate by category because protein and carbs are different'},
 Dinner:{type:'category',item:'Category Dinner',note:'Separate by category because protein and carbs are different'},
 Snack:{type:'standard',item:'Standard Snack',note:'Same portion for all customers'}
};
const standardMealCounts={Breakfast:0,Snack:0};
function kitchenMealSplit(){const rows=productionRowsForDate(dashboardDate());const categoryRows=mealCategories.map(c=>({cat:c[0],protein:c[1],carbs:c[2],count:rows.filter(r=>r.cat===c[0]&&(r.type==='Lunch'||r.type==='Dinner')).length}));return {standard:[['Breakfast',rows.filter(r=>r.type==='Breakfast').length,'Standard for all customers'],['Snack',rows.filter(r=>r.type==='Snacks').length,'Standard for all customers']],category:{Lunch:categoryRows,Dinner:categoryRows}}}
const weeklyMenu={
 Saturday:{Breakfast:['Eggs Benedict with Spinach','Muhammara Chicken Sandwich','Mix Berry Croissant','Egg Salad Sandwich'],Lunch:["Steakhouse Penne Pasta","Spicy Coriander Chicken with Rice","Shish Tawook with Couscous Rice","Mediterranean Chicken Salad"],Dinner:["Chicken Club Sandwich","Thai Shrimp Curry with Rice","Spinach Chicken Risotto","Harak Osbao"],Snacks:['Triangle Fruit Salad','Chicken Stuffed Zucchinis','Celery & Carrot Soup','Green Salad']},
 Sunday:{Breakfast:['Peanut Butter Oats','Spinach, Mushrooms & Cheese Omelette','Eggplant Fatteh','Avocado Egg Croissant & Tomato Jam'],Lunch:["Mongolian Beef Rice Bowl","Chipotle Chicken Burger","Chicken Pesto Fettuccine","Grilled Chicken Greek Salad"],Dinner:["Salmon Sayadieh","Chicken Moulkhiya with White Rice","Chicken Penne Arrabbiata","Honey Mustard Chicken Salad"],Snacks:['Lime & Pistachio Energy Balls','Chicken & Corn Soup','Talbina','Date Stuffed Roll']},
 Monday:{Breakfast:['Cinnamon French Toast','Egg & Turkey Protein Burrito','Tuna Club Sandwich','Shakshouka with Pita Bread'],Lunch:["Butter Chicken with Saffron Rice","Creamy Chicken Orzo","Kimchi Beef Burger","Beetroot Goat Cheese Chicken Salad"],Dinner:["Chicken & Mushroom Risotto","Tandoori Chicken with Couscous Rice","Sweet Potato Burger Bowl","Crunchy Chicken Tahini Salad"],Snacks:['Orange Salad','Chicken & Broccoli Soup','Chocolate Cashew Bites','Mixed Fruit Granola Bowl']},
 Tuesday:{Breakfast:['Falafel Eggplant Wrap','Orange French Toast','Cheese Eggs & Bacon Sandwich','Healthy Shawarma Wrap'],Lunch:["Chicken Katsu Curry with White Rice","Roast Pumpkin Chicken Pasta","Beef Steak with Mash & Grilled Veggies","Spinach Chicken Salad"],Dinner:["Bang Bang Chicken & Coconut Rice Bowl","Shrimp Chow Mein","Chicken Burrito Bowl","Chicken Cobb Salad"],Snacks:['Lazy Cake Bar','Chia Fruit Salad','Pumpkin Soup','Cinnamon Apple Yogurt']},
 Wednesday:{Breakfast:['Smoked Turkey Wrap','Cinnamon Banana Pancakes','Eggs & Velvet Hummus Sandwich','Mushroom Egg & Cheese Sandwich'],Lunch:["Koshary with Crispy Beef Bacon","Chicken Quesadilla","Healthy Shrimp Mmawash","Triangle Tuna Salad"],Dinner:["Bukhari Rice with Chicken","Bacon & Cheese Beef Burger","Spicy Pink Sauce Shrimp Pasta","Grilled Corn & Chicken Salad"],Snacks:['Clear Veggie Soup','New York Style Cheesecake','Oats and Berries','Protein Chocolate Pudding']},
 Thursday:{Breakfast:['Pepperoni Egg and Cheese Sandwich','French Toast with Berries & Syrup','Chicken Salad Sandwich','Carrots & Banana Pancakes'],Lunch:["Teriyaki Salmon Rice Bowl","Spaghetti & Meatballs","Stuffed Chicken Breast with White Rice","Watermelon & Feta Chicken Salad"],Dinner:["Thai Green Chicken Curry with Rice","Pesto Shell Pasta with Grilled Shrimps","Caesar Chicken Wrap & Roasted Potatoes","Grilled Teriyaki Chicken Salad"],Snacks:['Tuna Salad','Cream of Mushroom Soup','Dark Chocolate Granola Bar','Coconut Energy Balls']}
};
weeklyMenu.Friday=weeklyMenu.Thursday;
const defaultStandardNutrition={"Saturday":{"Breakfast":[{"calories":175,"protein":13,"carbs":12,"fat":9},{"calories":170,"protein":16,"carbs":16,"fat":5},{"calories":230,"protein":5,"carbs":30,"fat":10},{"calories":212,"protein":13,"carbs":19,"fat":10}],"Snacks":[{"calories":94,"protein":1,"carbs":22,"fat":0},{"calories":110,"protein":12,"carbs":8,"fat":3},{"calories":75,"protein":2,"carbs":12,"fat":2},{"calories":60,"protein":2,"carbs":8,"fat":2}]},"Sunday":{"Breakfast":[{"calories":236,"protein":10,"carbs":32,"fat":8},{"calories":187,"protein":16,"carbs":5,"fat":11},{"calories":124,"protein":6,"carbs":14,"fat":5},{"calories":235,"protein":11,"carbs":24,"fat":12}],"Snacks":[{"calories":320,"protein":8,"carbs":32,"fat":18},{"calories":72,"protein":7,"carbs":7,"fat":2},{"calories":130,"protein":5,"carbs":24,"fat":2},{"calories":300,"protein":5,"carbs":48,"fat":10}]},"Monday":{"Breakfast":[{"calories":195,"protein":8,"carbs":28,"fat":6},{"calories":180,"protein":17,"carbs":16,"fat":6},{"calories":188,"protein":18,"carbs":18,"fat":5},{"calories":131,"protein":8,"carbs":15,"fat":4}],"Snacks":[{"calories":78,"protein":1,"carbs":18,"fat":0},{"calories":58,"protein":7,"carbs":5,"fat":1},{"calories":400,"protein":9,"carbs":35,"fat":25},{"calories":136,"protein":5,"carbs":25,"fat":3}]},"Tuesday":{"Breakfast":[{"calories":208,"protein":9,"carbs":28,"fat":7},{"calories":229,"protein":8,"carbs":36,"fat":6},{"calories":180,"protein":14,"carbs":14,"fat":8},{"calories":193,"protein":17,"carbs":20,"fat":5}],"Snacks":[{"calories":260,"protein":5,"carbs":30,"fat":14},{"calories":105,"protein":3,"carbs":18,"fat":4},{"calories":70,"protein":3,"carbs":11,"fat":2},{"calories":180,"protein":9,"carbs":28,"fat":4}]},"Wednesday":{"Breakfast":[{"calories":190,"protein":18,"carbs":20,"fat":5},{"calories":189,"protein":7,"carbs":30,"fat":5},{"calories":177,"protein":12,"carbs":18,"fat":7},{"calories":180,"protein":14,"carbs":16,"fat":8}],"Snacks":[{"calories":32,"protein":1,"carbs":6,"fat":0},{"calories":321,"protein":7,"carbs":28,"fat":21},{"calories":102,"protein":4,"carbs":18,"fat":2},{"calories":140,"protein":16,"carbs":12,"fat":3}]},"Thursday":{"Breakfast":[{"calories":186,"protein":14,"carbs":14,"fat":9},{"calories":204,"protein":7,"carbs":34,"fat":5},{"calories":170,"protein":17,"carbs":17,"fat":4},{"calories":160,"protein":6,"carbs":28,"fat":3}],"Snacks":[{"calories":140,"protein":20,"carbs":3,"fat":6},{"calories":70,"protein":3,"carbs":8,"fat":3},{"calories":280,"protein":7,"carbs":34,"fat":13},{"calories":280,"protein":6,"carbs":30,"fat":15}]}};
const defaultLunchDinnerCombined={"Sunday":{"Lunch":[{"baseProtein":100,"baseCarbs":100,"calories":382,"protein":29,"carbs":30,"fat":15},{"baseProtein":100,"baseCarbs":100,"calories":325,"protein":35,"carbs":30,"fat":7},{"baseProtein":100,"baseCarbs":100,"calories":323,"protein":37,"carbs":31,"fat":5},{"baseProtein":100,"baseCarbs":100,"calories":165,"protein":31,"carbs":8,"fat":4}],"Dinner":[{"baseProtein":100,"baseCarbs":100,"calories":373,"protein":25,"carbs":30,"fat":16},{"baseProtein":100,"baseCarbs":100,"calories":295,"protein":34,"carbs":28,"fat":4},{"baseProtein":100,"baseCarbs":100,"calories":323,"protein":37,"carbs":31,"fat":5},{"baseProtein":100,"baseCarbs":100,"calories":185,"protein":32,"carbs":10,"fat":5}]},"Monday":{"Lunch":[{"baseProtein":100,"baseCarbs":100,"calories":343,"protein":34,"carbs":31,"fat":8},{"baseProtein":100,"baseCarbs":100,"calories":315,"protein":36,"carbs":29,"fat":5},{"baseProtein":100,"baseCarbs":100,"calories":390,"protein":33,"carbs":30,"fat":17},{"baseProtein":100,"baseCarbs":100,"calories":210,"protein":31,"carbs":9,"fat":7}],"Dinner":[{"baseProtein":100,"baseCarbs":100,"calories":323,"protein":34,"carbs":31,"fat":7},{"baseProtein":100,"baseCarbs":100,"calories":277,"protein":35,"carbs":23,"fat":4},{"baseProtein":100,"baseCarbs":100,"calories":307,"protein":28,"carbs":21,"fat":12},{"baseProtein":100,"baseCarbs":100,"calories":210,"protein":32,"carbs":10,"fat":8}]},"Tuesday":{"Lunch":[{"baseProtein":100,"baseCarbs":100,"calories":295,"protein":34,"carbs":28,"fat":4},{"baseProtein":100,"baseCarbs":100,"calories":310,"protein":37,"carbs":28,"fat":5},{"baseProtein":100,"baseCarbs":100,"calories":304,"protein":28,"carbs":20,"fat":12},{"baseProtein":100,"baseCarbs":100,"calories":180,"protein":31,"carbs":8,"fat":5}],"Dinner":[{"baseProtein":100,"baseCarbs":100,"calories":345,"protein":34,"carbs":30,"fat":8},{"baseProtein":100,"baseCarbs":100,"calories":257,"protein":30,"carbs":25,"fat":3},{"baseProtein":100,"baseCarbs":100,"calories":325,"protein":34,"carbs":30,"fat":6},{"baseProtein":100,"baseCarbs":100,"calories":195,"protein":32,"carbs":9,"fat":7}]},"Wednesday":{"Lunch":[{"baseProtein":100,"baseCarbs":100,"calories":377,"protein":29,"carbs":30,"fat":15},{"baseProtein":100,"baseCarbs":100,"calories":330,"protein":35,"carbs":30,"fat":8},{"baseProtein":100,"baseCarbs":100,"calories":244,"protein":27,"carbs":20,"fat":3},{"baseProtein":100,"baseCarbs":100,"calories":205,"protein":30,"carbs":6,"fat":8}],"Dinner":[{"baseProtein":100,"baseCarbs":100,"calories":330,"protein":34,"carbs":30,"fat":6.6},{"baseProtein":100,"baseCarbs":100,"calories":390,"protein":33,"carbs":30,"fat":17},{"baseProtein":100,"baseCarbs":100,"calories":323,"protein":30,"carbs":31,"fat":5},{"baseProtein":100,"baseCarbs":100,"calories":190,"protein":31,"carbs":10,"fat":5}]},"Thursday":{"Lunch":[{"baseProtein":100,"baseCarbs":100,"calories":378,"protein":25,"carbs":30,"fat":16},{"baseProtein":100,"baseCarbs":100,"calories":378,"protein":31,"carbs":31,"fat":15},{"baseProtein":100,"baseCarbs":100,"calories":295,"protein":34,"carbs":28,"fat":4},{"baseProtein":100,"baseCarbs":100,"calories":190,"protein":31,"carbs":8,"fat":6}],"Dinner":[{"baseProtein":100,"baseCarbs":100,"calories":325,"protein":34,"carbs":30,"fat":6},{"baseProtein":100,"baseCarbs":100,"calories":323,"protein":30,"carbs":31,"fat":5},{"baseProtein":100,"baseCarbs":100,"calories":252,"protein":33,"carbs":20,"fat":4},{"baseProtein":100,"baseCarbs":100,"calories":185,"protein":31,"carbs":9,"fat":5}]},"Saturday":{"Lunch":[{"baseProtein":100,"baseCarbs":100,"calories":375,"protein":32,"carbs":31,"fat":13},{"baseProtein":100,"baseCarbs":100,"calories":325,"protein":34,"carbs":30,"fat":6},{"baseProtein":100,"baseCarbs":100,"calories":277,"protein":35,"carbs":23,"fat":4},{"baseProtein":100,"baseCarbs":100,"calories":180,"protein":31,"carbs":8,"fat":5}],"Dinner":[{"baseProtein":100,"baseCarbs":100,"calories":330,"protein":35,"carbs":30,"fat":8},{"baseProtein":100,"baseCarbs":100,"calories":264,"protein":27,"carbs":30,"fat":3},{"baseProtein":100,"baseCarbs":100,"calories":323,"protein":34,"carbs":31,"fat":7},{"baseProtein":100,"baseCarbs":100,"calories":245,"protein":12,"carbs":35,"fat":6}]}};
const menuDays=['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday'];
const menuMealTypes=['Breakfast','Lunch','Dinner','Snacks'];
const macroFields=['calories','protein','carbs','fat'];
const combinedMacroFields=['baseProtein','baseCarbs','calories','protein','carbs','fat'];
const ingredientNutritionDb={
 chickenBreast:{label:'Chicken breast, cooked',calories:165,protein:31,carbs:0,fat:3.6},
 beefCooked:{label:'Lean beef, cooked',calories:217,protein:26,carbs:0,fat:12},
 salmonCooked:{label:'Salmon, cooked',calories:208,protein:20,carbs:0,fat:13},
 shrimpCooked:{label:'Shrimp, cooked',calories:99,protein:24,carbs:.2,fat:.3},
 whiteFishCooked:{label:'White fish, cooked',calories:105,protein:22,carbs:0,fat:1.5},
 lentilsCooked:{label:'Lentils, cooked',calories:116,protein:9,carbs:20,fat:.4},
 whiteRiceCooked:{label:'White rice, cooked',calories:130,protein:2.7,carbs:28,fat:.3},
 bukhariRiceCooked:{label:'Bukhari rice, cooked',calories:165,protein:3,carbs:30,fat:3},
 couscousCooked:{label:'Couscous, cooked',calories:112,protein:3.8,carbs:23.2,fat:.2},
 pastaCooked:{label:'Pasta, cooked',calories:158,protein:5.8,carbs:30.9,fat:.9},
 potatoCooked:{label:'Potato, cooked',calories:87,protein:1.9,carbs:20.1,fat:.1},
 sweetPotatoCooked:{label:'Sweet potato, cooked',calories:86,protein:1.6,carbs:20.1,fat:.1},
 breadWrap:{label:'Bread or wrap',calories:265,protein:9,carbs:49, fat:3.2},
 mixedVegetables:{label:'Mixed vegetables',calories:35,protein:2,carbs:7,fat:.2},
 saladVegetables:{label:'Salad vegetables',calories:20,protein:1.2,carbs:3.6,fat:.2},
 cookingOil:{label:'Cooking oil or sauce fat',calories:884,protein:0,carbs:0,fat:100}
};
function macroCalories449(n){return niceMacro(Number(n.protein||0)*4+Number(n.carbs||0)*4+Number(n.fat||0)*9)}
function mealProteinIngredient(name){const text=String(name||'').toLowerCase();if(/salmon/.test(text))return 'salmonCooked';if(/shrimp|prawn/.test(text))return 'shrimpCooked';if(/beef|steak|bacon|meatball|koshary/.test(text))return 'beefCooked';if(/fish|tuna/.test(text))return 'whiteFishCooked';if(/harak|lentil/.test(text))return 'lentilsCooked';return 'chickenBreast'}
function mealCarbIngredient(name){const text=String(name||'').toLowerCase();if(/bukhari/.test(text))return 'bukhariRiceCooked';if(/couscous/.test(text))return 'couscousCooked';if(/pasta|penne|fettuccine|orzo|spaghetti|chow mein|risotto/.test(text))return 'pastaCooked';if(/sweet potato/.test(text))return 'sweetPotatoCooked';if(/potato|mash/.test(text))return 'potatoCooked';if(/burger|sandwich|wrap|quesadilla|club/.test(text))return 'breadWrap';return 'whiteRiceCooked'}
function mealExtraIngredients(name){const text=String(name||'').toLowerCase();const extras=[];if(/salad/.test(text))extras.push({ingredient:'saladVegetables',weight:90});else if(/veggie|vegetable|mushroom|spinach|cobb|greek/.test(text))extras.push({ingredient:'mixedVegetables',weight:50});if(!/salad/.test(text))extras.push({ingredient:'cookingOil',weight:/burger|pesto|butter|creamy|bacon|sayadieh|teriyaki|curry|risotto|arrabbiata/.test(text)?7:4});return extras}
function lunchDinnerRecipe(day,type,index,cat){const sourceDay=day==='Friday'?'Thursday':day;const name=weeklyMenu[sourceDay]?.[type]?.[Number(index)||0]||'';const row=mealCategoryRow(cat);return [{ingredient:mealProteinIngredient(name),weight:Number(row[1]||0)},{ingredient:mealCarbIngredient(name),weight:Number(row[2]||0)},...mealExtraIngredients(name)]}
function calculateRecipeNutrition(recipe){const totals={calories:0,protein:0,carbs:0,fat:0};const details=recipe.map(item=>{const base=ingredientNutritionDb[item.ingredient]||ingredientNutritionDb.chickenBreast;const factor=Number(item.weight||0)/100;const row={label:base.label,weight:Number(item.weight||0),calories:niceMacro(base.calories*factor),protein:niceMacro(base.protein*factor),carbs:niceMacro(base.carbs*factor),fat:niceMacro(base.fat*factor)};macroFields.forEach(field=>totals[field]+=Number(row[field]||0));return row});const summedCalories=niceMacro(totals.calories);const macroCalories=macroCalories449(totals);const difference=niceMacro(Math.abs(summedCalories-macroCalories));return {calories:macroCalories,protein:niceMacro(totals.protein),carbs:niceMacro(totals.carbs),fat:niceMacro(totals.fat),ingredientCalories:summedCalories,macroCalories,difference,warning:difference>5,details,hasData:true,method:'4-4-9'}}
function escHtml(value){return String(value??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))}
function escAttr(value){return escHtml(value).replace(/'/g,'&#39;')}
function syncFridayMenu(){weeklyMenu.Friday=weeklyMenu.Thursday;if(window.menuNutrition)menuNutrition.Friday=menuNutrition.Thursday;if(window.categoryNutrition)categoryNutrition.Friday=categoryNutrition.Thursday;if(window.combinedNutrition)combinedNutrition.Friday=combinedNutrition.Thursday}
function defaultNutrition(type,index){return {calories:'',protein:'',carbs:'',fat:''}}
function defaultCombinedNutrition(){return {baseProtein:100,baseCarbs:100,calories:'',protein:'',carbs:'',fat:''}}
function defaultStandardFor(day,type,index){const sourceDay=day==='Friday'?'Thursday':day;return {...defaultNutrition(type,index),...(((defaultStandardNutrition[sourceDay]||{})[type]||[])[Number(index)||0]||{})}}
function defaultCombinedFor(day,type,index){const sourceDay=day==='Friday'?'Thursday':day;return {...defaultCombinedNutrition(),...(((defaultLunchDinnerCombined[sourceDay]||{})[type]||[])[Number(index)||0]||{})}}
function niceMacro(value){const n=Number(value||0);return Number.isFinite(n)?Number(n.toFixed(1)):0}
const menuNutrition={};window.menuNutrition=menuNutrition;
const categoryNutrition={};window.categoryNutrition=categoryNutrition;
const combinedNutrition={};window.combinedNutrition=combinedNutrition;
function initMenuNutrition(){menuDays.forEach(day=>{menuNutrition[day]={};categoryNutrition[day]={};combinedNutrition[day]={};menuMealTypes.forEach(type=>{menuNutrition[day][type]=[0,1,2,3].map(i=>({...defaultStandardFor(day,type,i)}));combinedNutrition[day][type]=[0,1,2,3].map(i=>({...defaultCombinedFor(day,type,i)}));categoryNutrition[day][type]=[0,1,2,3].map(()=>{const row={};mealCategories.forEach(cat=>row[cat[0]]={calories:'',protein:'',carbs:'',fat:''});return row})})});syncFridayMenu()}
function loadSavedMenu(){try{const saved=JSON.parse(localStorage.getItem('triangleMenu')||'null');if(saved){menuDays.forEach(day=>{if(saved[day]){menuMealTypes.forEach(type=>{if(Array.isArray(saved[day][type])&&saved[day][type].length>=4){weeklyMenu[day][type]=saved[day][type].slice(0,4)}})}})}const savedNutrition=JSON.parse(localStorage.getItem('triangleMenuNutrition')||'null');if(savedNutrition){menuDays.forEach(day=>{if(savedNutrition[day]){menuMealTypes.forEach(type=>{if(Array.isArray(savedNutrition[day][type])){menuNutrition[day][type]=[0,1,2,3].map(i=>({...defaultStandardFor(day,type,i),...(savedNutrition[day][type][i]||{})}))}})}})}const savedCombined=JSON.parse(localStorage.getItem('triangleCombinedNutrition')||'null');if(savedCombined){menuDays.forEach(day=>{if(savedCombined[day]){menuMealTypes.forEach(type=>{if(Array.isArray(savedCombined[day][type])){combinedNutrition[day][type]=[0,1,2,3].map(i=>({...defaultCombinedNutrition(),...(savedCombined[day][type][i]||{})}))}})}})}const savedCategoryNutrition=JSON.parse(localStorage.getItem('triangleCategoryNutrition')||'null');if(savedCategoryNutrition){menuDays.forEach(day=>{if(savedCategoryNutrition[day]){menuMealTypes.forEach(type=>{if(Array.isArray(savedCategoryNutrition[day][type])){categoryNutrition[day][type]=[0,1,2,3].map(i=>{const row={};mealCategories.forEach(cat=>row[cat[0]]={calories:'',protein:'',carbs:'',fat:'',...((savedCategoryNutrition[day][type][i]||{})[cat[0]]||{})});return row})}})}})}syncFridayMenu()}catch(e){console.warn('Menu restore skipped',e)}}
function saveMenuToStorage(){const data={};const nutrition={};const catNutrition={};const combined={};menuDays.forEach(day=>{data[day]={};nutrition[day]={};catNutrition[day]={};combined[day]={};menuMealTypes.forEach(type=>{data[day][type]=weeklyMenu[day][type].slice(0,4);nutrition[day][type]=menuNutrition[day][type].map(n=>({...n}));combined[day][type]=combinedNutrition[day][type].map(n=>({...n}));catNutrition[day][type]=categoryNutrition[day][type].map(row=>JSON.parse(JSON.stringify(row)))})});localStorage.setItem('triangleMenu',JSON.stringify(data));localStorage.setItem('triangleMenuNutrition',JSON.stringify(nutrition));localStorage.setItem('triangleCombinedNutrition',JSON.stringify(combined));localStorage.setItem('triangleCategoryNutrition',JSON.stringify(catNutrition))}
function migrateSavedSaturdaySundaySwap(){try{if(localStorage.getItem('triangleSatSunSwapV1')==='done')return;const saved=JSON.parse(localStorage.getItem('triangleMenu')||'null');if(saved?.Saturday?.Breakfast?.[0]==='Banana oatmeal with peanut butter'&&saved?.Sunday?.Breakfast?.[0]==='Eggs and velvet hummus sandwich'){const oldSat=saved.Saturday;saved.Saturday=saved.Sunday;saved.Sunday=oldSat;localStorage.setItem('triangleMenu',JSON.stringify(saved));const savedNutrition=JSON.parse(localStorage.getItem('triangleMenuNutrition')||'null');if(savedNutrition?.Saturday&&savedNutrition?.Sunday){const n=savedNutrition.Saturday;savedNutrition.Saturday=savedNutrition.Sunday;savedNutrition.Sunday=n;localStorage.setItem('triangleMenuNutrition',JSON.stringify(savedNutrition))}const savedCat=JSON.parse(localStorage.getItem('triangleCategoryNutrition')||'null');if(savedCat?.Saturday&&savedCat?.Sunday){const c=savedCat.Saturday;savedCat.Saturday=savedCat.Sunday;savedCat.Sunday=c;localStorage.setItem('triangleCategoryNutrition',JSON.stringify(savedCat))}}localStorage.setItem('triangleSatSunSwapV1','done')}catch(e){console.warn('Saturday/Sunday saved menu migration skipped',e)}}

function itemNutrition(day,type,index){const sourceDay=day==='Friday'?'Thursday':day;return {...defaultStandardFor(sourceDay,type,index),...((menuNutrition[sourceDay]||{})[type]||[])[Number(index)||0]}}
function combinedNutritionRow(day,type,index){const sourceDay=day==='Friday'?'Thursday':day;return {...defaultCombinedFor(sourceDay,type,index),...(((combinedNutrition[sourceDay]||{})[type]||[])[Number(index)||0]||{})}}
function autoCategoryNutrition(day,type,index,cat){return (type==='Lunch'||type==='Dinner')?calculateRecipeNutrition(lunchDinnerRecipe(day,type,index,cat)):{calories:0,protein:0,carbs:0,fat:0,hasData:false}}
function combinedHasData(row){return ['calories','protein','carbs','fat'].some(field=>row[field]!==''&&row[field]!=null)}
function categoryMacroValue(day,type,index,cat,field){const sourceDay=day==='Friday'?'Thursday':day;return (((categoryNutrition[sourceDay]||{})[type]||[])[Number(index)||0]||{})[cat]?.[field]??''}
function setCategoryMacroValue(day,type,index,cat,field,value){if(!categoryNutrition[day])categoryNutrition[day]={};if(!categoryNutrition[day][type])categoryNutrition[day][type]=[];if(!categoryNutrition[day][type][index])categoryNutrition[day][type][index]={};if(!categoryNutrition[day][type][index][cat])categoryNutrition[day][type][index][cat]={calories:'',protein:'',carbs:'',fat:''};categoryNutrition[day][type][index][cat][field]=value}
function categoryNutritionRow(day,type,index,cat){const sourceDay=day==='Friday'?'Thursday':day;return (((categoryNutrition[sourceDay]||{})[type]||[])[Number(index)||0]||{})[cat]||{calories:'',protein:'',carbs:'',fat:''}}

function mealCategoryRow(cat){return mealCategories.find(c=>c[0]===cat)||mealCategories[0]}
function calculatedNutrition(day,type,index,cat){if(type==='Lunch'||type==='Dinner')return autoCategoryNutrition(day,type,index,cat);const n=itemNutrition(day,type,index);const calories=Number(n.calories||0);const protein=Number(n.protein||0);const carbs=Number(n.carbs||0);const fat=Number(n.fat||0);return {calories,protein,carbs,fat,hasData:[n.calories,n.protein,n.carbs,n.fat].some(v=>v!==''&&v!=null),method:'standard'}}
window.calculatedNutrition=calculatedNutrition;
globalThis.calculatedNutrition=calculatedNutrition;
function macroText(day,type,index,cat){const n=calculatedNutrition(day,type,index,cat);if(!n.hasData)return (type==='Lunch'||type==='Dinner')?'Category nutrition pending':'Nutrition pending';return n.calories+' kcal - P '+n.protein+'g - C '+n.carbs+'g - F '+n.fat+'g'+(n.method==='4-4-9'?' - 4-4-9':'')}
function menuEditorHtml(edit){if(!edit)return '<div class="locked-panel">Only Boss and Admin can edit the current menu and nutrition.</div>';const dayPanel=day=>'<article class="menu-edit-day day-panel '+(day===menuDays[0]?'active':'')+'" data-editor-day="'+day+'"><h3>'+day+'</h3>'+menuMealTypes.map(type=>'<div class="menu-edit-meal"><strong>'+type+'</strong>'+[0,1,2,3].map(i=>{const n=itemNutrition(day,type,i);const lunchDinner=type==='Lunch'||type==='Dinner';const base=combinedNutritionRow(day,type,i);const categoryRows=mealCategories.map(cat=>{const code=cat[0];const auto=autoCategoryNutrition(day,type,i,code);return '<div class="category-macro-row auto-category-row"><b>'+code+'</b><span>'+cat[1]+'g chicken/meat</span><span>'+cat[2]+'g rice/potato</span>'+macroFields.map(field=>'<label><span>'+({calories:'Cal',protein:'Protein',carbs:'Carbs',fat:'Fat'}[field])+'</span><input readonly type="number" placeholder="'+(field==='calories'?'kcal':'g')+'" data-cat-macro="'+field+'" data-menu-day="'+day+'" data-menu-type="'+type+'" data-menu-index="'+i+'" data-menu-cat="'+code+'" value="'+escAttr(auto[field])+'"></label>').join('')+'</div>'}).join('');const combinedBox='<div class="combined-macro-box"><div class="category-nutrition-head"><strong>Auto A-F Macro Calculator</strong><span>Enter combined base values. A-F calculates automatically.</span></div><div class="combined-macro-grid"><label><span>Base Chicken/Meat g</span><input type="number" data-combined-macro="baseProtein" data-menu-day="'+day+'" data-menu-type="'+type+'" data-menu-index="'+i+'" value="'+escAttr(base.baseProtein)+'"></label><label><span>Base Rice/Potato g</span><input type="number" data-combined-macro="baseCarbs" data-menu-day="'+day+'" data-menu-type="'+type+'" data-menu-index="'+i+'" value="'+escAttr(base.baseCarbs)+'"></label><label><span>Calories</span><input type="number" data-combined-macro="calories" data-menu-day="'+day+'" data-menu-type="'+type+'" data-menu-index="'+i+'" value="'+escAttr(base.calories)+'"></label><label><span>Protein</span><input type="number" data-combined-macro="protein" data-menu-day="'+day+'" data-menu-type="'+type+'" data-menu-index="'+i+'" value="'+escAttr(base.protein)+'"></label><label><span>Carbs</span><input type="number" data-combined-macro="carbs" data-menu-day="'+day+'" data-menu-type="'+type+'" data-menu-index="'+i+'" value="'+escAttr(base.carbs)+'"></label><label><span>Fat</span><input type="number" data-combined-macro="fat" data-menu-day="'+day+'" data-menu-type="'+type+'" data-menu-index="'+i+'" value="'+escAttr(base.fat)+'"></label></div><small>Example: if your value is for 100g chicken + 100g rice, keep base 100 / 100. The system scales by category total grams.</small></div>';return '<div class="menu-edit-option"><label class="dish-name"><span>Option '+(i+1)+'</span><input data-menu-day="'+day+'" data-menu-type="'+type+'" data-menu-index="'+i+'" value="'+escAttr(weeklyMenu[day][type][i]||'')+'"></label><div class="menu-photo-tool"><img src="'+escAttr(menuItemPhoto(day,type,i,weeklyMenu[day][type][i]||'')||exploreFoodImage(weeklyMenu[day][type][i]||('Option '+(i+1)),type))+'" alt="" data-menu-photo-preview="'+escAttr(day+'|'+type+'|'+i)+'"><div><button type="button" class="primary-btn light menu-photo-upload-btn" data-menu-photo-pick="'+escAttr(day+'|'+type+'|'+i)+'">Upload Photo</button><button type="button" class="primary-btn light menu-photo-delete" data-menu-photo-delete="'+escAttr(day+'|'+type+'|'+i)+'">Delete</button><small>JPG, PNG or WebP. Photo updates Explore, menu selection and customer portal.</small></div><input type="file" accept="image/png,image/jpeg,image/webp" data-menu-photo-upload="'+escAttr(day+'|'+type+'|'+i)+'" hidden></div>'+(lunchDinner?combinedBox+'<div class="category-nutrition auto-category-table"><div class="category-nutrition-head"><strong>Generated Category Macros</strong><span>Readonly auto values for '+type.toLowerCase()+'</span></div><div class="category-auto-head"><b>Cat</b><span>Chicken/Meat</span><span>Rice/Potato</span><span>Cal</span><span>Protein</span><span>Carbs</span><span>Fat</span></div>'+categoryRows+'</div>':'<div class="macro-grid"><label><span>Cal</span><input type="number" placeholder="kcal" data-macro="calories" data-menu-day="'+day+'" data-menu-type="'+type+'" data-menu-index="'+i+'" value="'+escAttr(n.calories)+'"></label><label><span>Protein</span><input type="number" placeholder="g" data-macro="protein" data-menu-day="'+day+'" data-menu-type="'+type+'" data-menu-index="'+i+'" value="'+escAttr(n.protein)+'"></label><label><span>Carbs</span><input type="number" placeholder="g" data-macro="carbs" data-menu-day="'+day+'" data-menu-type="'+type+'" data-menu-index="'+i+'" value="'+escAttr(n.carbs)+'"></label><label><span>Fat</span><input type="number" placeholder="g" data-macro="fat" data-menu-day="'+day+'" data-menu-type="'+type+'" data-menu-index="'+i+'" value="'+escAttr(n.fat)+'"></label></div><small>Enter your exact nutrition for this fixed breakfast/snack.</small>')+'</div>'}).join('')+'</div>').join('')+'</article>';return '<div class="menu-day-tabs">'+menuDays.map(day=>'<button type="button" class="menu-day-tab '+(day===menuDays[0]?'active':'')+'" data-editor-tab="'+day+'">'+day+'</button>').join('')+'</div><div class="menu-editor single-day-editor">'+menuDays.map(dayPanel).join('')+'</div><div class="menu-actions"><button class="primary-btn green" id="saveCurrentMenu">Save Current Menu + Nutrition</button><button class="primary-btn light" id="resetCurrentMenu">Reset Browser Changes</button><span>Breakfast/snacks are standard. Lunch/dinner A-F macros are generated automatically.</span></div>'}
function bindMenuEditor(){if(!canEdit())return;function refreshAutoCategoryRows(scope=document){$$('[data-combined-macro]',scope).forEach(input=>{const day=input.dataset.menuDay,type=input.dataset.menuType,index=Number(input.dataset.menuIndex);const data={...combinedNutritionRow(day,type,index)};combinedMacroFields.forEach(field=>{const el=document.querySelector('[data-combined-macro="'+field+'"][data-menu-day="'+day+'"][data-menu-type="'+type+'"][data-menu-index="'+index+'"]');if(el)data[field]=el.value.trim()===''?'':Number(el.value||0)});mealCategories.forEach(cat=>{const ratioBase=Number(data.baseProtein||0)+Number(data.baseCarbs||0);const ratio=ratioBase?(Number(cat[1])+Number(cat[2]))/ratioBase:0;const auto={calories:niceMacro(Number(data.calories||0)*ratio),protein:niceMacro(Number(data.protein||0)*ratio),carbs:niceMacro(Number(data.carbs||0)*ratio),fat:niceMacro(Number(data.fat||0)*ratio)};macroFields.forEach(field=>{const out=document.querySelector('[data-cat-macro="'+field+'"][data-menu-day="'+day+'"][data-menu-type="'+type+'"][data-menu-index="'+index+'"][data-menu-cat="'+cat[0]+'"]');if(out)out.value=auto[field]})})})}document.querySelectorAll('.menu-day-tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.menu-day-tab').forEach(x=>x.classList.toggle('active',x===tab));document.querySelectorAll('.day-panel').forEach(panel=>panel.classList.toggle('active',panel.dataset.editorDay===tab.dataset.editorTab))}));$$('[data-combined-macro]').forEach(input=>input.addEventListener('input',()=>refreshAutoCategoryRows()));document.querySelectorAll('[data-menu-photo-pick]').forEach(btn=>btn.addEventListener('click',()=>document.querySelector('[data-menu-photo-upload="'+btn.dataset.menuPhotoPick+'"]')?.click()));
document.querySelectorAll('[data-menu-photo-upload]').forEach(input=>input.addEventListener('change',()=>{const file=input.files&&input.files[0];if(!file)return;if(!/^image\/(png|jpe?g|webp)$/i.test(file.type)){toast('Please upload JPG, PNG or WebP only.');input.value='';return}if(file.size>exploreMenuMaxImageBytes){toast('Image is too large. Please use a photo up to 10 MB.');input.value='';return}readExploreMenuImage(file,(value,meta)=>{if(!value){toast('Could not read this image. Please try another photo.');input.value='';return}const parts=input.dataset.menuPhotoUpload.split('|');setMenuPhoto(parts[0],parts[1],parts[2],value);document.querySelectorAll('[data-menu-photo-preview="'+input.dataset.menuPhotoUpload+'"]').forEach(img=>img.src=value);toast((meta&&meta.optimized)?'Photo optimized and saved for this menu item.':'Photo saved for this menu item.')})}));
document.querySelectorAll('[data-menu-photo-delete]').forEach(btn=>btn.addEventListener('click',()=>{const parts=btn.dataset.menuPhotoDelete.split('|');setMenuPhoto(parts[0],parts[1],parts[2],'');const name=weeklyMenu[parts[0]]?.[parts[1]]?.[Number(parts[2])]||'Menu Item';document.querySelectorAll('[data-menu-photo-preview="'+btn.dataset.menuPhotoDelete+'"]').forEach(img=>img.src=exploreFoodImage(name,parts[1]));toast('Photo deleted for this menu item.')}));$('#saveCurrentMenu')?.addEventListener('click',()=>{refreshAutoCategoryRows();menuDays.forEach(day=>menuMealTypes.forEach(type=>{weeklyMenu[day][type]=[0,1,2,3].map(i=>document.querySelector('[data-menu-day="'+day+'"][data-menu-type="'+type+'"][data-menu-index="'+i+'"]:not([data-macro]):not([data-cat-macro]):not([data-combined-macro])')?.value.trim()||('Option '+(i+1)));menuNutrition[day][type]=[0,1,2,3].map(i=>{const current=itemNutrition(day,type,i);const data={...current};macroFields.forEach(field=>{const input=document.querySelector('[data-macro="'+field+'"][data-menu-day="'+day+'"][data-menu-type="'+type+'"][data-menu-index="'+i+'"]');if(input)data[field]=input.value.trim()===''?'':Number(input.value||0)});return data});combinedNutrition[day][type]=[0,1,2,3].map(i=>{const current=combinedNutritionRow(day,type,i);const data={...current};combinedMacroFields.forEach(field=>{const input=document.querySelector('[data-combined-macro="'+field+'"][data-menu-day="'+day+'"][data-menu-type="'+type+'"][data-menu-index="'+i+'"]');if(input)data[field]=input.value.trim()===''?'':Number(input.value||0)});return data});categoryNutrition[day][type]=[0,1,2,3].map(i=>{const row={};mealCategories.forEach(cat=>{const code=cat[0];row[code]={};macroFields.forEach(field=>{const input=document.querySelector('[data-cat-macro="'+field+'"][data-menu-day="'+day+'"][data-menu-type="'+type+'"][data-menu-index="'+i+'"][data-menu-cat="'+code+'"]');if(input){row[code][field]=input.value.trim()===''?'':Number(input.value||0)}else{const existing=categoryMacroValue(day,type,i,code,field);row[code][field]=existing==null?'':existing}})});return row})}));syncFridayMenu();saveMenuToStorage();toast('Menu saved. Lunch/dinner category macros calculated automatically.');renderMealPlans()});$('#resetCurrentMenu')?.addEventListener('click',()=>{localStorage.removeItem('triangleMenu');localStorage.removeItem('triangleMenuNutrition');localStorage.removeItem('triangleCombinedNutrition');localStorage.removeItem('triangleCategoryNutrition');localStorage.removeItem(menuPhotoStorageKey);toast('Saved browser menu changes cleared. Reloading original menu.');location.reload()});refreshAutoCategoryRows()}
function refreshIngredientCategoryRows(scope=document){$$('[data-cat-macro]',scope).forEach(out=>{const n=autoCategoryNutrition(out.dataset.menuDay,out.dataset.menuType,Number(out.dataset.menuIndex),out.dataset.menuCat);out.value=n[out.dataset.catMacro]??''})}
function saveIngredientCategoryNutrition(){menuDays.forEach(day=>['Lunch','Dinner'].forEach(type=>{categoryNutrition[day][type]=[0,1,2,3].map(i=>{const row={};mealCategories.forEach(cat=>{const n=autoCategoryNutrition(day,type,i,cat[0]);row[cat[0]]={calories:n.calories,protein:n.protein,carbs:n.carbs,fat:n.fat}});return row})}));syncFridayMenu();saveMenuToStorage()}
const bindMenuEditorLegacy=bindMenuEditor;
bindMenuEditor=function(){bindMenuEditorLegacy();refreshIngredientCategoryRows();$$('[data-combined-macro]').forEach(input=>input.addEventListener('input',()=>refreshIngredientCategoryRows()));$('#saveCurrentMenu')?.addEventListener('click',()=>{refreshIngredientCategoryRows();saveIngredientCategoryNutrition()})}

function ensureMenuVersion(){try{const version='fullMenu20260702v3';if(localStorage.getItem('triangleMenuVersion')!==version){['triangleMenu','triangleMenuNutrition','triangleCombinedNutrition','triangleCategoryNutrition'].forEach(key=>localStorage.removeItem(key));localStorage.setItem('triangleMenuVersion',version)}}catch(e){console.warn('Menu version reset skipped',e)}}
initMenuNutrition();
ensureMenuVersion();
migrateSavedSaturdaySundaySwap();
loadSavedMenu();
function weeklyMenuHtml(){return '<div class="menu-week-grid">'+Object.entries(weeklyMenu).map(([day,meals])=>'<article class="menu-day"><h3>'+day+(day==='Friday'?' <span>same as Thursday</span>':'')+'</h3>'+menuMealTypes.map(type=>'<div class="menu-meal"><strong>'+type+'</strong><ol>'+meals[type].map((item,i)=>'<li>'+escHtml(item)+'<small>'+macroText(day,type,i,'A')+(type==='Lunch'||type==='Dinner'?' - shown using Category A example':'')+'</small></li>').join('')+'</ol></div>').join('')+'</article>').join('')+'</div>'}
function menuSelectOptions(){return Object.entries(weeklyMenu).flatMap(([day,meals])=>Object.entries(meals).flatMap(([type,items])=>items.map(item=>'<option>'+escHtml(day+' - '+type+' - '+item)+'</option>'))).join('')}

const exploreMenuStorageKey='triangleExploreMenu';
const exploreMenuMaxImageBytes=10*1024*1024;
const exploreMenuMaxImagePixels=10000000;
const exploreMealTypes=['Breakfast','Lunch','Dinner','Snacks'];
const exploreMenuDefaults=[
 {day:'Saturday',dayNo:1,meals:{Breakfast:['Eggs & Velvet Hummus Sandwich','Turkish Eggs','Chicken Salad Sandwich with Chives','Grilled Halloumi & Zaatar Croissant'],Lunch:['Chicken & Mushroom Risotto','Thai Shrimp Curry with Rice','Grilled Chicken with Pomegranate Rice','Quinoa & Berry Chicken Salad'],Dinner:['Creamy Mushroom Chicken Pasta','Pulled Beef Quesadilla','Chimichurri Chicken & Roasted Potatoes','Chickpea Avocado Chicken Salad'],Snacks:['Gil-E-Firdaus Pudding','Roasted Cauliflower Soup','Cinnamon Apple Yogurt','Chicken Spring Roll']}},
 {day:'Sunday',dayNo:2,meals:{Breakfast:['Banana Oatmeal with Peanut Butter','Cheese Eggs & Bacon Sandwich','Pesto Chicken Breakfast Wrap','Avocado Toast with Poached Eggs'],Lunch:['Musakhan Chicken with Cinnamon Rice','Beef Bamia with Couscous Rice','Chicken Molokhiya with Rice','Grilled Chicken Greek Salad'],Dinner:['Chicken Club Sandwich','Shrimp & Broccoli Risotto','Roasted Garlic Chicken Burger','Beetroot Goat Cheese Chicken Salad'],Snacks:['Peanut Butter Protein Bar','Healthy Chicken & Broccoli Soup','Mix Berry Chia Pudding','Mango Float']}},
 {day:'Monday',dayNo:3,meals:{Breakfast:['Cinnamon French Toast','Smoked Turkey & Egg Croissant','Falafel Burrito Wrap','Muhammara Chicken Sandwich'],Lunch:['Chicken Pizzaiola with White Rice','Garlic Shrimp Marinara with Dill Rice','Peri Peri Chicken & Rice','Quinoa & Lentil Salad with Grilled Shrimp'],Dinner:['Chicken Meatball Pasta','Mushroom Swiss Burger','Pomegranate Chicken Wrap','Green Salad with Grilled Chicken'],Snacks:['Mixed Fruit Granola Bowl','French Onion Soup','Peanut Butter Oats','Dark Chocolate Granola Bar']}},
 {day:'Tuesday',dayNo:4,meals:{Breakfast:['Eggplant Fatteh','Healthy Sunny Side Up Eggs','Cottage Cheese Chicken Sandwich','Tropical Porridge'],Lunch:['Chicken Meatballs with Lemon Rice','Baked Salmon with Kidney Bean Rice','Grilled Chicken with Potato Rice','Harak Osbao'],Dinner:['Chicken Quesadilla','Smoked Onion Beef Burger','Basil & Spinach Shrimp Pasta','Honey Mustard Chicken Salad'],Snacks:['Matcha Tiramisu','Exotic Granola','Chicken & Corn Soup','Dark Chocolate Peanut Butter Balls']}},
 {day:'Wednesday',dayNo:5,meals:{Breakfast:['Mix Berry Compote Pancake','Mushroom Egg & Cheese Croissant','Scrambled Egg & Turkey Ham Sandwich','Tuna Avocado Sandwich with Capers'],Lunch:['Bukhari Rice with Chicken & Rob Khiyar','Shrimp Biryani','Butter Chicken with Saffron Rice','Chicken Caesar Salad'],Dinner:['Cajun Chicken Burger','Tenderloin Steak with Mashed Potatoes','Chicken Pesto Fettuccine','Grilled Corn & Chicken Salad'],Snacks:['Tropical Chia Pudding Parfait','Chicken Mushroom Puffs','Quinoa Tabbouleh Salad','Berry Bloom Cheesecake']}},
 {day:'Thursday',dayNo:6,meals:{Breakfast:['Pepperoni Egg & Cheese Sandwich','Ful Medames with Boiled Eggs','Spinach Eggs & Cheese Pita','Oats with Fruits & Nuts'],Lunch:['Dawood Basha with Vermicelli Rice','Chicken Stir Fry with Coriander Rice','Grilled Fish with Dill Rice','Rocca Salad with Shredded Beef'],Dinner:['Chicken BLT Sandwich','Protein Chicken Power Bowl','Bacon Jam Beef Burger','Grilled Teriyaki Chicken Salad'],Snacks:['Raspberry Granola Bowl','Creamy Cucumber Salad','Protein Chocolate Mousse','Chocolate Peanut Bar']}}
];
function defaultExploreMenu(){return exploreMenuDefaults.map(day=>({day:day.day,dayNo:day.dayNo,meals:Object.fromEntries(exploreMealTypes.map(type=>[type,day.meals[type].map(name=>({name,badge:'Regular',image:''}))]))}))}
function getExploreMenu(){try{const saved=JSON.parse(localStorage.getItem(exploreMenuStorageKey)||'null');if(Array.isArray(saved)&&saved.length===6)return saved}catch(e){console.warn('Explore menu restore skipped',e)}return defaultExploreMenu()}
function saveExploreMenu(data){localStorage.setItem(exploreMenuStorageKey,JSON.stringify(data))}
function readExploreMenuImage(file,done){const reader=new FileReader();reader.onload=()=>{const original=String(reader.result||'');const img=new Image();img.onload=()=>{try{const pixels=(img.naturalWidth||0)*(img.naturalHeight||0);const scale=pixels>exploreMenuMaxImagePixels?Math.sqrt(exploreMenuMaxImagePixels/pixels):1;const width=Math.max(1,Math.round((img.naturalWidth||1)*scale));const height=Math.max(1,Math.round((img.naturalHeight||1)*scale));const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,width,height);done(canvas.toDataURL('image/jpeg',0.88),{width,height,optimized:pixels>exploreMenuMaxImagePixels})}catch(e){console.warn('Explore image optimization skipped',e);done(original,{width:img.naturalWidth||0,height:img.naturalHeight||0,optimized:false})}};img.onerror=()=>done(original,{width:0,height:0,optimized:false});img.src=original};reader.onerror=()=>done('',{width:0,height:0,optimized:false});reader.readAsDataURL(file)}
const menuPhotoStorageKey='triangleMenuPhotos';
function menuPhotoKey(day,type,index){return [day==='Friday'?'Thursday':day,type,Number(index)||0].join('|')}
function savedMenuPhotos(){try{const data=JSON.parse(localStorage.getItem(menuPhotoStorageKey)||'{}');return data&&typeof data==='object'?data:{}}catch(e){return {}}}
function saveMenuPhotos(data){localStorage.setItem(menuPhotoStorageKey,JSON.stringify(data||{}))}
function setMenuPhoto(day,type,index,value){const data=savedMenuPhotos();const key=menuPhotoKey(day,type,index);if(value)data[key]=value;else delete data[key];saveMenuPhotos(data)}
function menuItemPhoto(day,type,index,name){const sourceDay=day==='Friday'?'Thursday':day;const key=menuPhotoKey(sourceDay,type,index);const photos=savedMenuPhotos();if(photos[key])return photos[key];try{const explore=getExploreMenu();const active=explore.find(x=>x.day===sourceDay)||explore[0];const byIndex=active?.meals?.[type]?.[Number(index)||0];if(byIndex?.image)return byIndex.image;const byName=(active?.meals?.[type]||[]).find(item=>item.name===name);if(byName?.image)return byName.image}catch(e){}return ''}
function menuOptionPhoto(day,type,index,name){return menuItemPhoto(day,type,Number(index)-1,name)||exploreFoodImage(name,type)}
function foodVisualKind(name,type){const text=String(name||'').toLowerCase();if(/oat|porridge|talbina/.test(text))return 'oats';if(/pancake|french toast|toast.*berr|cinnamon.*toast/.test(text))return 'pancake-toast';if(/egg|omelet|shakshuka|fatteh|ful medames/.test(text))return 'eggs';if(/mushroom soup|cream of mushroom/.test(text))return 'mushroom-soup';if(/soup|broth|bisque/.test(text))return 'soup';if(/fruit salad|orange salad|dessert|berry|fruit|pudding|yogurt|granola|bar|chocolate|tiramisu|snack|date|balls|float|cheesecake|bites|mousse/.test(text)||type==='Snacks')return 'dessert';if(/burger/.test(text))return 'burger';if(/wrap|burrito|quesadilla|roll|pita/.test(text))return 'wrap';if(/butter chicken|thai|teriyaki|coriander rice|saffron rice|coconut rice|curry/.test(text))return 'curry-rice';if(/biryani|bukhari|mmawash|sayadieh|rice bowl|with rice|rice/.test(text))return 'rice-bowl';if(/potato|mash|roasted/.test(text))return 'roasted-potato';if(/chicken.*salad|salad.*chicken|greek salad|honey mustard.*salad|caesar salad|cobb salad|green salad/.test(text))return 'chicken-salad';if(/chicken.*pasta|pasta.*chicken|penne|fettuccine|arrabbiata|spaghetti|orzo/.test(text))return 'chicken-pasta';if(/sandwich|croissant|club/.test(text))return 'sandwich';if(/salad|tabbouleh|greens|quinoa|rocca/.test(text))return 'salad';if(/fish|salmon|shrimp|seafood|tuna/.test(text))return 'seafood';if(/chicken|turkey|beef|meat|kofta|steak/.test(text))return 'protein';if(type==='Breakfast')return 'breakfast';return type==='Dinner'?'protein':'bowl'}
function exploreFoodImage(name,type){
  const kind=foodVisualKind(name,type);
  const fileMap={breakfast:'breakfast',oats:'oats','pancake-toast':'pancake-toast',eggs:'eggs',burger:'burger',wrap:'wrap','rice-bowl':'rice-bowl','curry-rice':'curry-rice','roasted-potato':'roasted-potato','chicken-salad':'chicken-salad','chicken-pasta':'chicken-pasta',sandwich:'sandwich',pasta:'pasta',salad:'salad',soup:'soup','mushroom-soup':'mushroom-soup',dessert:'dessert',protein:'protein',seafood:'seafood',snack:'snack',bowl:'protein'};
  return 'assets/menu-photos/menu-photo-'+(fileMap[kind]||'protein')+'.jpg?v=20260726-08';
}
function exploreMealIcon(type){
  const svgStart='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  const icons={
    Breakfast:svgStart+'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
    Lunch:svgStart+'<path d="M6 13c5-7 10-8 14-8-1 8-6 13-14 14-2-2-2-4 0-6Z"/><path d="M7 17c4-1 7-4 10-9"/></svg>',
    Dinner:svgStart+'<path d="M17 3a8 8 0 1 0 4 13 7 7 0 0 1-4-13Z"/></svg>',
    Snacks:svgStart+'<circle cx="8" cy="8" r="3"/><circle cx="15" cy="9" r="3"/><circle cx="11" cy="15" r="3"/><path d="M15 3c2 1 3 2 4 4"/></svg>'
  };
  return icons[type]||icons.Lunch;
}function menuItemDescription(item,type){return item.description||('Balanced '+String(type||'meal').toLowerCase()+' prepared fresh by Triangle Healthy Kitchen.')}
function exploreCardHtml(item,type,day,index){const src=menuItemPhoto(day,type,index,item.name)||item.image||exploreFoodImage(item.name,type);return '<article class="explore-food-card"><img loading="lazy" src="'+escAttr(src)+'" alt="'+escAttr(item.name)+'"><div><strong>'+escHtml(item.name)+'</strong><small>'+escHtml(type)+' - '+escHtml(menuItemDescription(item,type))+'</small><span>'+escHtml(item.badge||'Regular')+'</span></div></article>'}
function exploreMenuHtml(activeIndex=0){const data=getExploreMenu();const active=data[activeIndex]||data[0];const dayNav=data.map((day,i)=>'<button type="button" class="explore-day '+(i===activeIndex?'active':'')+'" data-explore-day="'+i+'"><span>'+exploreMealIcon('Breakfast')+'</span><b>'+escHtml(day.day)+'</b><small>Day '+day.dayNo+'</small></button>').join('')+'<button type="button" class="explore-day closed" disabled><span><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span><b>Friday</b><small>Closed</small></button>';return '<div class="explore-menu-overlay open" role="dialog" aria-modal="true" aria-label="Explore Menu"><div class="explore-shell"><aside class="explore-sidebar"><div class="explore-brand"><img class="brand-mark-sm" src="triangle-logo-badge-v2.png?v=20260712-13" alt="Triangle Healthy Kitchen logo"><div><b>TRIANGLE</b><small>HEALTHY KITCHEN</small></div></div><nav>'+dayNav+'</nav><div class="explore-note"><b>This is a sample menu for exploration only.</b><span>Your actual weekly menu will be available after account approval and package activation.</span></div></aside><main class="explore-content"><div class="explore-top"><div><span>EXPLORE OUR 6-DAY MENU</span><h2>'+escHtml(active.day)+' - Day '+active.dayNo+'</h2><p>Discover a variety of chef-crafted, wholesome and delicious meals.</p></div><div class="explore-actions"><select aria-label="Menu type"><option>Regular</option></select><button type="button" class="explore-close" data-explore-close>Close</button></div></div><div class="explore-sections">'+exploreMealTypes.map(type=>'<section class="explore-section"><div class="explore-section-label"><span>'+exploreMealIcon(type)+'</span><b>'+escHtml(type).toUpperCase()+'</b></div><div class="explore-card-grid">'+(active.meals[type]||[]).map((item,itemIndex)=>exploreCardHtml(item,type,active.day,itemIndex)).join('')+'</div></section>').join('')+'</div></main></div></div>'}
function showExploreMenu(index=0){document.querySelector('.explore-menu-overlay')?.remove();document.body.insertAdjacentHTML('beforeend',exploreMenuHtml(index));document.body.classList.add('explore-menu-open');applyI18n(document.querySelector('.explore-menu-overlay'))}
function closeExploreMenu(){document.querySelector('.explore-menu-overlay')?.remove();document.body.classList.remove('explore-menu-open')}
function exploreMenuEditorHtml(editable){
 const data=getExploreMenu();
 if(!editable)return '<div class="locked-panel">Only CEO and Admin can edit the Explore Menu.</div>';
 return '<div class="explore-editor"><div class="explore-editor-top"><div><h3>Explore Menu Editor</h3><p>Manage names and food photos for the customer-facing sample menu. Uploads are optimized and saved in this browser for the demo.</p></div><div><button type="button" class="primary-btn light" id="previewExploreMenu">Preview Explore Menu</button><button type="button" class="primary-btn green" id="saveExploreMenu">Save Explore Menu</button></div></div><div class="menu-day-tabs explore-editor-tabs">'+data.map((day,i)=>'<button type="button" class="menu-day-tab '+(i===0?'active':'')+'" data-explore-editor-tab="'+i+'">'+escHtml(day.day)+'</button>').join('')+'</div>'+data.map((day,dayIndex)=>'<article class="explore-editor-day day-panel '+(dayIndex===0?'active':'')+'" data-explore-editor-day="'+dayIndex+'"><h4>'+escHtml(day.day)+' - Day '+day.dayNo+'</h4>'+exploreMealTypes.map(type=>'<div class="explore-editor-meal"><strong>'+escHtml(type)+'</strong>'+(day.meals[type]||[]).map((item,itemIndex)=>{const editorId='explore-img-'+dayIndex+'-'+type+'-'+itemIndex;const preview=item.image||exploreFoodImage(item.name,type);return '<div class="explore-editor-row"><label><span>Meal Name</span><input data-explore-field="name" data-explore-day-index="'+dayIndex+'" data-explore-type="'+type+'" data-explore-item-index="'+itemIndex+'" value="'+escAttr(item.name)+'"></label><div class="explore-image-tool"><span>Food Image</span><div class="explore-image-preview"><img src="'+escAttr(preview)+'" alt="'+escAttr(item.name)+' preview" data-explore-preview="'+editorId+'"><div><label class="explore-upload-btn" for="'+editorId+'">Upload / Replace</label><button type="button" class="explore-clear-image" data-explore-clear="'+editorId+'">Delete</button><small>JPG, PNG or WebP up to 10 MB. Large photos are optimized for the demo preview.</small></div></div><input id="'+editorId+'" type="file" accept="image/png,image/jpeg,image/webp" data-explore-upload="'+editorId+'"><input data-explore-image-input="'+editorId+'" data-explore-field="image" data-explore-day-index="'+dayIndex+'" data-explore-type="'+type+'" data-explore-item-index="'+itemIndex+'" value="'+escAttr(item.image||'')+'" placeholder="Optional image link"></div><label><span>Badge</span><input data-explore-field="badge" data-explore-day-index="'+dayIndex+'" data-explore-type="'+type+'" data-explore-item-index="'+itemIndex+'" value="'+escAttr(item.badge||'Regular')+'"></label></div>'}).join('')+'</div>').join('')+'</article>').join('')+'<div class="menu-actions"><button type="button" class="primary-btn light" id="resetExploreMenu">Reset Explore Menu</button><span>Customer preview uses these saved names and images immediately.</span></div></div>'
}
function bindExploreMenuEditor(){
 if(!canEdit())return;
 document.querySelectorAll('[data-explore-editor-tab]').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('[data-explore-editor-tab]').forEach(x=>x.classList.toggle('active',x===tab));document.querySelectorAll('[data-explore-editor-day]').forEach(panel=>panel.classList.toggle('active',panel.dataset.exploreEditorDay===tab.dataset.exploreEditorTab))}));
 document.querySelectorAll('[data-explore-upload]').forEach(input=>input.addEventListener('change',()=>{const file=input.files&&input.files[0];if(!file)return;if(!/^image\/(png|jpe?g|webp)$/i.test(file.type)){toast('Please upload JPG, PNG or WebP only.');input.value='';return}if(file.size>exploreMenuMaxImageBytes){toast('Image is too large. Please use a photo up to 10 MB.');input.value='';return}readExploreMenuImage(file,(value,meta)=>{const id=input.dataset.exploreUpload;if(!value){toast('Could not read this image. Please try another photo.');input.value='';return}const imageInput=document.querySelector('[data-explore-image-input="'+id+'"]');const preview=document.querySelector('[data-explore-preview="'+id+'"]');if(imageInput)imageInput.value=value;if(preview)preview.src=value;toast((meta&&meta.optimized)?'Image optimized to 10MP and ready. Click Save Explore Menu.':'Image ready. Click Save Explore Menu.')})}));
 document.querySelectorAll('[data-explore-clear]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.exploreClear;const imageInput=document.querySelector('[data-explore-image-input="'+id+'"]');const preview=document.querySelector('[data-explore-preview="'+id+'"]');const fileInput=document.querySelector('[data-explore-upload="'+id+'"]');if(imageInput)imageInput.value='';if(fileInput)fileInput.value='';if(preview){const parts=id.replace('explore-img-','').split('-');const day=getExploreMenu()[Number(parts[0])];const type=parts.slice(1,-1).join('-');const item=day?.meals?.[type]?.[Number(parts[parts.length-1])];preview.src=exploreFoodImage(item?.name||'Menu Item',type)}toast('Image cleared. Click Save Explore Menu.')}));
 $('#previewExploreMenu')?.addEventListener('click',()=>showExploreMenu(Number(document.querySelector('[data-explore-editor-tab].active')?.dataset.exploreEditorTab||0)));
 $('#saveExploreMenu')?.addEventListener('click',()=>{const data=getExploreMenu();document.querySelectorAll('[data-explore-field]').forEach(input=>{const day=data[Number(input.dataset.exploreDayIndex)];const item=day?.meals?.[input.dataset.exploreType]?.[Number(input.dataset.exploreItemIndex)];if(item)item[input.dataset.exploreField]=input.value.trim()});try{saveExploreMenu(data);toast('Explore Menu saved');renderMealPlans()}catch(e){console.warn('Explore menu save failed',e);toast('This image is still too large for the local demo browser storage. Please choose a smaller photo or image link.')}});
 $('#resetExploreMenu')?.addEventListener('click',()=>{localStorage.removeItem(exploreMenuStorageKey);toast('Explore Menu reset to default sample menu');renderMealPlans()})
}
document.addEventListener('click',e=>{if(e.target.closest('[data-explore-menu]')){showExploreMenu(0);return}if(e.target.closest('[data-explore-close]')){closeExploreMenu();return}const day=e.target.closest('[data-explore-day]');if(day){showExploreMenu(Number(day.dataset.exploreDay||0));return}if(e.target.classList.contains('explore-menu-overlay'))closeExploreMenu()});

const packages=mealSelectionPackages.filter(p=>!p.custom).map(p=>({name:p.price+' QTR Package',price:p.price,meals:p.mealCount,calendarDays:30,deliveryDays:24,friday:false,cycle:'Monthly',mealPackageId:p.id,packageLabel:p.label}));
const subscriptionRules=[{name:'Weekly Package',calendarDays:7,deliveryDays:6,friday:false,note:'1 week package: 7 calendar days, 6 deliveries, except Friday'},{name:'Monthly Package',calendarDays:30,deliveryDays:24,friday:false,note:'1 month package: 30 calendar days, 24 deliveries, all Fridays excluded'}];
function loadSavedPackages(){try{const saved=JSON.parse(localStorage.getItem('triangleSubscriptionPackages')||'null');if(Array.isArray(saved)&&saved.length===packages.length&&saved.every(p=>p.mealPackageId)){saved.forEach((p,i)=>{if(packages[i])Object.assign(packages[i],p)})}else if(saved){localStorage.removeItem('triangleSubscriptionPackages')}}catch(e){console.warn('Package restore skipped',e)}}
function savePackages(){localStorage.setItem('triangleSubscriptionPackages',JSON.stringify(packages))}
function packageEditorHtml(editable){if(!editable)return '<div class="locked-panel"><h2>View Only</h2><p>Only Boss/Admin can edit subscription packages.</p></div>';return '<div class="package-editor">'+packages.map((p,i)=>'<article class="package-edit-row"><label><span>Package Name</span><input data-package-field="name" data-package-index="'+i+'" value="'+escAttr(p.name)+'"></label><label><span>Price QAR</span><input type="number" data-package-field="price" data-package-index="'+i+'" value="'+p.price+'"></label><label><span>Meals</span><input type="number" data-package-field="meals" data-package-index="'+i+'" value="'+p.meals+'"></label><label><span>Calendar Days</span><input type="number" data-package-field="calendarDays" data-package-index="'+i+'" value="'+p.calendarDays+'"></label><label><span>Deliveries</span><input type="number" data-package-field="deliveryDays" data-package-index="'+i+'" value="'+p.deliveryDays+'"></label><label><span>Cycle</span><select data-package-field="cycle" data-package-index="'+i+'"><option '+(p.cycle==='Weekly'?'selected':'')+'>Weekly</option><option '+(p.cycle==='Monthly'?'selected':'')+'>Monthly</option><option '+(p.cycle==='Custom'?'selected':'')+'>Custom</option></select></label><label class="inline-check package-friday"><span>Friday</span><input type="checkbox" data-package-field="friday" data-package-index="'+i+'" '+(p.friday?'checked':'')+'><b>Include Friday</b></label></article>').join('')+'</div><div class="menu-actions"><button type="button" class="primary-btn green" id="savePackagesBtn">Save Subscription Packages</button><button type="button" class="primary-btn light" id="resetPackagesBtn">Reset Package Changes</button><span>Use 7/6 for weekly and 30/24 for monthly if Friday is excluded.</span></div>'}
function bindPackageEditor(){if(!canEdit())return;$('#savePackagesBtn')?.addEventListener('click',()=>{$$('[data-package-field]').forEach(input=>{const i=Number(input.dataset.packageIndex);const field=input.dataset.packageField;if(!packages[i])return;if(field==='friday')packages[i][field]=input.checked;else if(['price','meals','calendarDays','deliveryDays'].includes(field))packages[i][field]=Number(input.value||0);else packages[i][field]=input.value});packages.forEach(p=>{p.name=p.name||((p.price||0)+' QTR Package')});savePackages();toast('Subscription packages updated');renderSubscriptions()});$('#resetPackagesBtn')?.addEventListener('click',()=>{localStorage.removeItem('triangleSubscriptionPackages');packages.splice(0,packages.length,...mealSelectionPackages.filter(p=>!p.custom).map(p=>({name:p.price+' QTR Package',price:p.price,meals:p.mealCount,calendarDays:30,deliveryDays:24,friday:false,cycle:'Monthly',mealPackageId:p.id,packageLabel:p.label})));toast('Package changes reset to defaults.');renderSubscriptions()})}

loadSavedPackages();
const customers=[
 {name:'Mariam Al Naimi',cat:'C',zone:'Zone 66 - Onaiza, Leqtaifiya & Al Qassar',area:'The Pearl',plan:'2200 QTR Package',notes:'No spicy, no lactose, breakfast without yogurt',address:'The Pearl, Tower 8',deliveryTime:'08:10 AM',deliveryWindow:'08:00 - 08:30',status:'Active',mealPackageId:'3m1s',weeks:defaultWeekSelections(),includeFriday:false,differentChoices:[{dish:'Plain grilled chicken with rice',cat:'C'},{dish:'Egg whites only breakfast',cat:'Standard Breakfast'}]},
 {name:'Aisha Khan',cat:'A',zone:'Zone 90 - Al Wakrah',area:'Al Wakrah',plan:'1700 QTR Package',notes:'No spicy, avoid cream sauces',address:'Al Wakrah, Ezdan Oasis',deliveryTime:'08:35 AM',deliveryWindow:'08:30 - 09:00',status:'Active',mealPackageId:'2m1s',weeks:defaultWeekSelections(),includeFriday:false},
 {name:'Ahmed Mansoor',cat:'D',zone:'Zone 69 - Lusail, Al Egla & Wadi Al Banat',area:'Lusail',plan:'2000 QTR Package',notes:'Extra protein, no seafood',address:'Lusail Boulevard',deliveryTime:'09:00 AM',deliveryWindow:'09:00 - 09:30',status:'Active',mealPackageId:'3m',weeks:defaultWeekSelections(),includeFriday:false},
 {name:'Sara Al Kuwari',cat:'B',zone:'Zone 61 - Al Dafna & Al Qassar',area:'West Bay',plan:'2400 QTR Package',notes:'No nuts, low salt',address:'West Bay Tower 4',deliveryTime:'09:25 AM',deliveryWindow:'09:15 - 09:45',status:'Active',mealPackageId:'3m2s',weeks:defaultWeekSelections(),includeFriday:false},
 {name:'Nisha Thomas',cat:'F',zone:'Zone 74 - Simaisma, Al Jeryan & Al Khor City',area:'Al Khor',plan:'Custom Package',notes:'Too much notes: no spicy, no lactose, no nuts, no tomato',address:'Al Khor',deliveryTime:'10:10 AM',deliveryWindow:'10:00 - 10:30',status:'Custom',mealPackageId:'3m2s',weeks:defaultWeekSelections(),includeFriday:true,differentChoices:[{dish:'Custom salmon bowl',cat:'F'}]}
];
if(realDataMode)customers.length=0;
function normalizeCategoryCode(value){const code=String(value||'A').trim().toUpperCase();return mealCategories.some(c=>c[0]===code)?code:'A'}
function normalizeCustomerCategories(list=customers){list.forEach(c=>{c.cat=normalizeCategoryCode(c.cat);if(Array.isArray(c.differentChoices))c.differentChoices.forEach(choice=>{choice.cat=normalizeCategoryCode(choice.cat)})})}
function normalizePendingCustomerCategories(){try{const list=pendingCustomers();let changed=false;list.forEach(c=>{const next=normalizeCategoryCode(c.cat||c.health?.nutrition?.assignedCategory);if(c.cat!==next){c.cat=next;changed=true}if(c.health?.nutrition?.assignedCategory&&!mealCategories.some(row=>row[0]===String(c.health.nutrition.assignedCategory).toUpperCase())){c.health.nutrition.assignedCategory=next;changed=true}});if(changed)savePendingCustomers(list)}catch(e){console.warn('Pending category cleanup skipped',e)}}
const drivers=[['Mr. Patrick','Zone 1 - Doha Central & West Bay','Doha Central, West Bay, Corniche, Al Sadd','04:30 AM','12:30 PM','Transportation Manager'],['Mr. Kutub','Zone 2 - Pearl, Lusail & Al Daayen','The Pearl, Katara, Lusail, Duhail, Al Daayen','04:30 AM','12:30 PM','Ready'],['Mr. Issa','Zone 3 - Al Rayyan & Education City','Al Rayyan, Education City, Al Waab, Muaither','04:30 AM','12:30 PM','Ready'],['Mr. Azar','Zone 4 - Wakrah, Wukair & South','Al Wakrah, Al Wukair, Mesaieed, South Qatar','04:30 AM','12:30 PM','Ready'],['Mr. Jahid','Zone 5 - Umm Salal, Al Khor & North','Umm Salal, Al Khor, Al Shamal, North Qatar','04:30 AM','12:30 PM','Ready'],['Mr. Ajmal','Zone 6 - Shahaniya & Outer Qatar','Al Shahaniya, Dukhan, Umm Bab, Outer Qatar','04:30 AM','12:30 PM','Ready']];
const driverPhones={'Mr. Patrick':'30289440','Mr. Kutub':'33919797','Mr. Issa':'66948852','Mr. Azar':'70046261','Mr. Jahid':'50259263','Mr. Ajmal':'70331630'};
const qatarZones={
 'Zone 1 - Al Jasrah':['Al Jasrah'],
 'Zone 2 - Al Bidda':['Al Bidda'],
 'Zone 3 - Fereej Mohamed Bin Jasim & Mushayrib':['Fereej Mohamed Bin Jasim','Mushayrib'],
 'Zone 4 - Mushayrib':['Mushayrib'],
 'Zone 5 - Al Najada, Barahat Al Jufairi & Fereej Al Asmakh':['Al Najada','Barahat Al Jufairi','Fereej Al Asmakh'],
 'Zone 6 - Old Al Ghanim':['Old Al Ghanim'],
 'Zone 7 - Al Souq':['Al Souq','Souq Waqif'],
 'Zone 10 - Wadi Al Sail':['Wadi Al Sail'],
 'Zone 11 - Rumeilah':['Rumeilah'],
 'Zone 14 - Fereej Abdel Aziz':['Fereej Abdel Aziz'],
 'Zone 15 - Ad Dawhah Al Jadidah':['Ad Dawhah Al Jadidah'],
 'Zone 17 - Al Rufaa & Old Al Hitmi':['Al Rufaa','Old Al Hitmi'],
 'Zone 18 - As Salatah & Al Mirqab':['As Salatah','Al Mirqab'],
 'Zone 19 - Doha Port':['Doha Port'],
 'Zone 22 - Fereej Bin Mahmoud':['Fereej Bin Mahmoud'],
 'Zone 24 - Rawdat Al Khail':['Rawdat Al Khail'],
 'Zone 25 - Fereej Bin Durham & Al Mansoura':['Fereej Bin Durham','Fereej Bin Dirham','Al Mansoura'],
 'Zone 26 - Najma':['Najma'],
 'Zone 27 - Umm Ghuwailina':['Umm Ghuwailina'],
 'Zone 28 - Al Khulaifat & Ras Abu Aboud':['Al Khulaifat','Ras Abu Aboud'],
 'Zone 30 - Duhail':['Duhail'],
 'Zone 31 - Umm Lekhba':['Umm Lekhba'],
 'Zone 32 - Madinat Khalifa North & Dahl Al Hamam':['Madinat Khalifa North','Dahl Al Hamam'],
 'Zone 33 - Al Markhiya':['Al Markhiya'],
 'Zone 34 - Madinat Khalifa South':['Madinat Khalifa South'],
 'Zone 35 - Fereej Kulaib':['Fereej Kulaib'],
 'Zone 36 - Al Messila':['Al Messila'],
 'Zone 37 - Fereej Bin Omran, New Al Hitmi & Hamad Medical City':['Fereej Bin Omran','Bin Omran','New Al Hitmi','Hamad Medical City'],
 'Zone 38 - Al Sadd':['Al Sadd'],
 'Zone 39 - Al Sadd, New Al Mirqab & Fereej Al Nasr':['Al Sadd','New Al Mirqab','Fereej Al Nasr'],
 'Zone 40 - New Salatah':['New Salatah'],
 'Zone 41 - Nuaija':['Nuaija'],
 'Zone 42 - Al Hilal':['Al Hilal'],
 'Zone 45 - Old Airport':['Old Airport'],
 'Zone 46 - Al Thumama':['Al Thumama'],
 'Zone 48 - Doha International Airport':['Doha International Airport'],
 'Zone 49 - Ras Abu Fontas':['Ras Abu Fontas'],
 'Zone 50 - Doha Municipality':['Zone 50'],
 'Zone 51 - Al Gharrafa, Bani Hajer & Rawdat Egdaim':['Al Gharrafa','Izghawa','Bani Hajer','Al Seej','Rawdat Egdaim','Al Themaid'],
 'Zone 52 - Al Luqta, Lebday & Old Al Rayyan':['Al Luqta','Lebday','Old Al Rayyan','Al Shagub','Fereej Al Zaeem'],
 'Zone 53 - New Al Rayyan, Al Wajbah & Muaither':['New Al Rayyan','Al Wajbah','Muaither'],
 'Zone 54 - Fereej Al Amir, Muraikh & Baaya':['Fereej Al Amir','Luaib','Muraikh','Baaya','Mehairja','Fereej Al Soudan'],
 'Zone 55 - Al Waab, Al Aziziya, Bu Sidra & Al Sailiya':['Fereej Al Soudan','Al Waab','Al Aziziya','New Fereej Al Ghanim','Fereej Al Murra','Fereej Al Manaseer','Bu Sidra','Muaither','Al Sailiya','Al Mearad'],
 'Zone 56 - Abu Hamour, Mesaimeer & Ain Khaled':['Fereej Al Asiri','New Fereej Al Khulaifat','Bu Samra','Al Mamoura','Al Maamoura','Abu Hamour','Mesaimeer','Ain Khaled','Umm Al Seneem'],
 'Zone 57 - Industrial Area':['Industrial Area'],
 'Zone 58 - Wholesale Market':['Wholesale Market'],
 'Zone 61 - Al Dafna & Al Qassar':['Al Dafna','Al Qassar','West Bay'],
 'Zone 63 - Onaiza':['Onaiza'],
 'Zone 64 - Lejbailat':['Lejbailat'],
 'Zone 66 - Onaiza, Leqtaifiya & Al Qassar':['Onaiza','Leqtaifiya','Al Qassar','The Pearl','Porto Arabia','Qanat Quartier','Viva Bahriya','Medina Centrale','Katara'],
 'Zone 67 - Hazm Al Markhiya':['Hazm Al Markhiya'],
 'Zone 68 - Jelaiah, Al Tarfa & Jeryan Nejaima':['Jelaiah','Al Tarfa','Jeryan Nejaima'],
 'Zone 69 - Lusail, Al Egla & Wadi Al Banat':['Jabal Thuaileb','Al Kharayej','Lusail','Al Egla','Wadi Al Banat'],
 'Zone 70 - Al Daayen, Al Kheesa & Umm Qarn':['Leabaib','Al Ebb','Jeryan Jenaihat','Al Kheesa','Rawdat Al Hamama','Wadi Al Wasaah','Al Sakhama','Al Masrouhiya','Wadi Lusail','Lusail','Umm Qarn','Al Daayen'],
 'Zone 71 - Umm Salal':['Bu Fasseela','Izghawa','Al Kharaitiyat','Umm Salal Ali','Umm Salal Mohammed','Saina Al-Humaidi','Umm Al Amad','Umm Ebairiya'],
 'Zone 72 - Al Utouriya':['Al Utouriya'],
 'Zone 73 - Al Jemailiya':['Al Jemailiya'],
 'Zone 74 - Simaisma, Al Jeryan & Al Khor City':['Simaisma','Al Jeryan','Al Khor City','Al Khor'],
 'Zone 75 - Al Thakhira, Ras Laffan & Umm Birka':['Al Thakhira','Ras Laffan','Umm Birka'],
 'Zone 76 - Al Ghuwariyah':['Al Ghuwariyah'],
 'Zone 77 - Ain Sinan, Madinat Al Kaaban & Fuwayrit':['Ain Sinan','Madinat Al Kaaban','Fuwayrit'],
 'Zone 78 - Abu Dhalouf & Zubarah':['Abu Dhalouf','Zubarah'],
 'Zone 79 - Madinat Ash Shamal & Ar Ruays':['Madinat Ash Shamal','Ar Ruays'],
 'Zone 80 - Al Shahaniya City':['Al Shahaniya City'],
 'Zone 81 - Mebaireek':['Mebaireek'],
 'Zone 82 - Rawdat Rashed':['Rawdat Rashed'],
 'Zone 83 - Al Karaana':['Al Karaana'],
 'Zone 84 - Umm Bab':['Umm Bab'],
 'Zone 85 - Al Nasraniya':['Al Nasraniya'],
 'Zone 86 - Dukhan':['Dukhan','Zekreet'],
 'Zone 90 - Al Wakrah':['Al Wakrah'],
 'Zone 91 - Al Thumama, Al Wukair & Al Mashaf':['Al Thumama','Al Wukair','Al Mashaf','Ezdan Oasis','Barwa Village'],
 'Zone 92 - Mesaieed':['Mesaieed'],
 'Zone 93 - Mesaieed Industrial Area':['Mesaieed Industrial Area'],
 'Zone 94 - Shagra':['Shagra'],
 'Zone 95 - Al Kharrara':['Al Kharrara'],
 'Zone 96 - Abu Samra':['Abu Samra'],
 'Zone 97 - Sawda Natheel':['Sawda Natheel'],
 'Zone 98 - Khor Al Adaid':['Khor Al Adaid']
};
const driverRouteZoneGroups={
 'Mr. Patrick':['Zone 1','Zone 2','Zone 3','Zone 4','Zone 5','Zone 6','Zone 7','Zone 10','Zone 11','Zone 12','Zone 13','Zone 14','Zone 15','Zone 16','Zone 17','Zone 18','Zone 19','Zone 20','Zone 21','Zone 22','Zone 23','Zone 24','Zone 25','Zone 26','Zone 27','Zone 28','Zone 30','Zone 31','Zone 32','Zone 33','Zone 34','Zone 35','Zone 36','Zone 37','Zone 38','Zone 39','Zone 40','Zone 41','Zone 42','Zone 43','Zone 44','Zone 45','Zone 46','Zone 47','Zone 48','Zone 49','Zone 50','Zone 57','Zone 58','Zone 61','Zone 63','Zone 64','Zone 65','Zone 66','Zone 67','Zone 68'],
 'Mr. Kutub':['Zone 69','Zone 70'],
 'Mr. Issa':['Zone 51','Zone 52','Zone 53','Zone 54','Zone 55','Zone 56','Zone 81','Zone 83','Zone 96','Zone 97'],
 'Mr. Azar':['Zone 90','Zone 91','Zone 92','Zone 93','Zone 94','Zone 95','Zone 98'],
 'Mr. Jahid':['Zone 71','Zone 74','Zone 75','Zone 76','Zone 77','Zone 78','Zone 79'],
 'Mr. Ajmal':['Zone 72','Zone 73','Zone 80','Zone 82','Zone 84','Zone 85','Zone 86']
};
const zoneDriverMap=Object.fromEntries(Object.entries(driverRouteZoneGroups).flatMap(([driver,zones])=>zones.map(zone=>[zone,driver])));
function zoneShort(zone){const match=String(zone||'').match(/^Zone\s+\d+/i);return match?match[0]:String(zone||'').split(' - ')[0]}
function assignedDriver(zone){return zoneDriverMap[zoneShort(zone)]||'Unassigned'}
function customerDriver(c){return c.driverOverride||assignedDriver(c.zone)}
function timeToMinutes(value){const match=String(value||'').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);if(!match)return 9999;let h=Number(match[1]);const m=Number(match[2]);const ap=match[3].toUpperCase();if(ap==='PM'&&h!==12)h+=12;if(ap==='AM'&&h===12)h=0;return h*60+m}
function routeCustomersForDriver(driver){return customers.filter(c=>customerDriver(c)===driver).slice().sort((a,b)=>timeToMinutes(a.deliveryTime)-timeToMinutes(b.deliveryTime))}
function routeRowsForDriver(driver){return routeCustomersForDriver(driver).map((c,i)=>[i+1,c.deliveryTime||'-',c.deliveryWindow||'-',c.name,zoneShort(c.zone),c.area||'-',c.address,'<a class="map-link" target="_blank" href="'+customerMapLink(c)+'">Map</a>'])}
function liveDriverStatus(driver,index){const route=routeCustomersForDriver(driver);const d=drivers.find(x=>x[0]===driver);const fallbackAreas=(d?.[2]||'Qatar').split(',').map(x=>x.trim());const routeIndex=route.length?Math.min(index%route.length,route.length-1):0;const current=route[routeIndex];const next=route[routeIndex+1]||route[0];const area=current?.area||fallbackAreas[0]||'Qatar';const zone=current?.zone||d?.[1]||'';const delivered=route.length?routeIndex:0;const pending=Math.max(0,route.length-delivered);const percent=route.length?Math.round((delivered/route.length)*100):0;const status=index===3?'Delay':index===0?'Transport Manager':'On Route';return {driver,phone:driverPhones[driver]||'-',zone,area,current,next,delivered,pending,total:route.length,percent,status,google:mapsLink(area,current?.address||area)}}
function liveDriverStatuses(){return drivers.map((d,i)=>liveDriverStatus(d[0],i))}
function liveTrackingTable(){return table(['Driver','Phone','Current Place','Next Customer','Time','Pending','Status','Map'],liveDriverStatuses().map(s=>[s.driver,s.phone,s.area,s.next?s.next.name:'-',s.next?(s.next.deliveryTime||'-'):'-',s.pending,pill(s.status),'<a class="map-link" target="_blank" href="'+s.google+'">Open Location</a>']))}
function liveTrackingCards(){return '<div class="tracking-cards">'+liveDriverStatuses().map((s,i)=>'<article class="tracking-card"><div><strong>'+s.driver+'</strong><span>'+zoneShort(s.zone)+' - '+s.phone+'</span></div><b>'+s.status+'</b><p>Now near <strong>'+s.area+'</strong></p><p>Next: '+(s.next?s.next.name+' at '+(s.next.deliveryTime||'-'):'No customer route yet')+'</p><div class="track-meter"><i style="width:'+s.percent+'%"></i></div><small>'+s.delivered+' delivered - '+s.pending+' pending</small><button class="primary-btn light live-driver-btn" data-driver="'+s.driver+'" onclick="showLiveDriver(this.dataset.driver)">Show Live Details</button></article>').join('')+'</div>'}
function liveGoogleMapHtml(){const s=liveDriverStatuses()[0];return '<div class="google-live-map"><iframe id="liveGoogleMap" title="Live Google Map Qatar" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="'+googleMapEmbed(s.area,s.current?.address||s.area)+'"></iframe><div class="google-map-caption"><div><strong id="liveMapTitle">'+s.driver+'</strong><span id="liveMapSub">'+s.area+' - '+zoneShort(s.zone)+'</span></div><a id="liveMapOpen" class="map-link" target="_blank" href="'+s.google+'">Open Full Google Map</a></div></div>'}
function liveTrackingDetailHtml(s){const route=routeCustomersForDriver(s.driver);return '<strong>'+s.driver+'</strong><span>'+s.status+' - currently near '+s.area+' - '+s.phone+'</span><div class="live-detail-grid"><p><b>Zone</b>'+zoneShort(s.zone)+'</p><p><b>Delivered</b>'+s.delivered+' / '+s.total+'</p><p><b>Pending</b>'+s.pending+'</p><p><b>Next Stop</b>'+(s.next?s.next.name+' - '+(s.next.area||'-'):'-')+'</p></div>'+(route.length?table(['Stop','Time','Customer','Area','Map'],route.map((c,i)=>[i+1,c.deliveryTime||'-',c.name,c.area||'-','<a class="map-link" target="_blank" href="'+customerMapLink(c)+'">Open</a>'])):'<span>No customers assigned to this driver yet.</span>')}
function showLiveDriver(driver){const idx=drivers.findIndex(d=>d[0]===driver);const s=liveDriverStatus(driver,idx<0?0:idx);const target=$('#trackText');if(target)target.innerHTML=liveTrackingDetailHtml(s);const map=$('#liveGoogleMap');if(map)map.src=googleMapEmbed(s.area,s.current?.address||s.area);const title=$('#liveMapTitle');if(title)title.textContent=s.driver;const sub=$('#liveMapSub');if(sub)sub.textContent=s.area+' - '+zoneShort(s.zone);const open=$('#liveMapOpen');if(open)open.href=s.google;toast(driver+' live tracking opened')}
globalThis.showLiveDriver=showLiveDriver
function bindLiveTracking(){document.querySelectorAll('.live-driver-btn,.pin').forEach(btn=>btn.addEventListener('click',()=>showLiveDriver(btn.dataset.driver)));if(drivers[0]&&$('#trackText'))showLiveDriver(drivers[0][0])}
document.addEventListener('click',e=>{const liveTarget=e.target.closest?.('.live-driver-btn,.pin');if(liveTarget?.dataset?.driver)showLiveDriver(liveTarget.dataset.driver);if(e.target.closest?.('#printPacking'))printPackingSheet()});
const colors=['#1769d1','#16a66a','#f4a51c','#7041c9','#e3425f','#079a9a','#46556f'];
function toast(msg){const t=$('#toast');t.textContent=trSmart(msg);t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function canOpen(module){const r=roles[state.role];return !!r&&(r.allow==='all'||r.allow.includes(module))}
function canEdit(){return !!roles[state.role]?.edit}
function canManageDrivers(){return canEdit()||state.role==='transport'}
function money(n){return 'QAR '+Number(n).toLocaleString()}
function adminEnglishText(value){let text=String(value??'');if(!text.trim())return text;const exact={'??? 1000 ?.?':'1000 QTR Package','??? 1200 ?.?':'1200 QTR Package','??? 1500 ?.?':'1500 QTR Package','??? 1700 ?.?':'1700 QTR Package','??? 2000 ?.?':'2000 QTR Package','??? 2200 ?.?':'2200 QTR Package','??? ????':'Custom Package','??????':'Home','??????':'Office','??????':'Gym','??????':'Balanced','???? ????????':'High Protein','???? ????????????':'Low Carb','?????':'Vegetarian','????? ???????':'Vegan','????? ?????':'Lose Weight','???? ???????':'Build Muscle','?????? ??? ?????':'Maintain Weight','????? ?????':'Eat Healthy'};const trimmed=text.trim();if(exact[trimmed])return exact[trimmed];const map=[['????????','Allergies'],['??????','Allergies'],['???','Medical'],['????','Medical'],['?????? ???????','Diet'],['??????','Diet'],['??????? ??????','Kitchen note'],['?????? ??????','Kitchen note'],['?????? ???????','Delivery note'],['???? ???','No spicy'],['???? ??????','No spicy'],['?? ???','No spicy'],['??? ???','No spicy'],['???? ??????','No lactose'],['???? ?????','No lactose'],['???? ?????','No yogurt'],['???? ???','No dairy'],['???? ????','No milk'],['???? ???','No cheese'],['???? ???','No onion'],['???? ???','No garlic'],['???? ???','No mushroom'],['???? ?????','No tomato'],['???? ??????','No nuts'],['???? ??? ??????','No peanuts'],['???? ??????','No gluten'],['???? ???','No wheat'],['???? ??????? ?????','No seafood'],['???? ??????','No shrimp'],['???? ???','No fish'],['???? ?????','Low salt'],['???? ??? ??????','Call before arrival'],['???? ??? ???????','Call before delivery'],['????? ??? ??????','Call before arrival'],['???? ??? ?????????','Leave at reception'],['?????????','reception'],['?????','Home'],['??????','Home'],['??????','Office'],['??????','Gym'],['????','Diabetes'],['??? ????','Hypertension'],['?????? ???????????','High Cholesterol'],['????? ???????','Thyroid'],['?????? ????????','Lactose Intolerance'],['?????? ????????','Gluten Intolerance'],['???','Eggs'],['?????','Dairy'],['??????','Nuts'],['??? ??????','Peanuts'],['??????? ?????','Seafood'],['??????','Gluten'],['????','Soy'],['???','Wheat'],['???','Spicy'],['???','Onion'],['???','Garlic'],['???','Cheese'],['???','Mushroom'],['?????','Tomato']];map.forEach(([ar,en])=>{text=text.split(ar).join(en)});return text}
function adminCustomerValue(value){return escHtml(adminEnglishText(value||'-'))}
function badge(text,i=0){return '<span class="badge" style="background:'+colors[i%colors.length]+'">'+text+'</span>'}
function pill(text){const c=/active|ready|paid|route/i.test(text)?'good':/delay|expired|blocked/i.test(text)?'bad':/custom|pending|expiring/i.test(text)?'warn':'';return '<span class="pill '+c+'">'+text+'</span>'}
function table(headers,rows){return '<div class="table-wrap"><table><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
function kpis(items){return '<div class="grid kpi-grid">'+items.map(i=>'<article class="kpi"><span>'+i[0]+'</span><strong>'+i[1]+'</strong></article>').join('')+'</div>'}
function expiringCustomers(){const today=new Date();today.setHours(12,0,0,0);const soon=new Date(today);soon.setDate(today.getDate()+3);return customers.filter(c=>validDateValue(c.subscriptionEnd)&&new Date(c.subscriptionEnd+'T12:00:00')>=today&&new Date(c.subscriptionEnd+'T12:00:00')<=soon)}
function pendingPaymentCustomers(){return customers.filter(c=>/pending|proof uploaded|waiting admin approval|cash received|awaiting payment|overdue|cash/i.test(String(c.paymentStatus||c.payment?.status||'')+' '+String(c.payment?.method||''))||(ensureRenewalRequest(c)&&!/approved/i.test(renewalStatusText(c))))}
function requestCounts(){const registrations=pendingCustomers().length;let pauses=0;customers.forEach(c=>customerPauseRequests(c).forEach(r=>{if(r.status==='Pending')pauses++}));const expiring=expiringCustomers().length;const payments=pendingPaymentCustomers().length;return {registrations,pauses,expiring,payments,total:registrations+pauses+expiring+payments}}
function notificationItems(){const c=requestCounts();return [{key:'registrations',label:'New registrations',count:c.registrations,detail:c.registrations?'Review and approve customers':'No new registration requests'},{key:'pauses',label:'Pause / resume',count:c.pauses,detail:c.pauses?'Approve customer requests':'No pause/resume requests'},{key:'expiring',label:'Expiring soon',count:c.expiring,detail:c.expiring?'Renewal follow-up':'No customers expiring in 3 days'},{key:'payments',label:'Payments to approve',count:c.payments,detail:c.payments?'Proof/cash waiting for approval':'No payment approval waiting'}]}
function updateRequestBadge(){const btn=$('#notificationBtn');const count=$('#notificationCount');const menu=$('#notificationMenu');if(!btn)return;const c=requestCounts();const show=canEdit();btn.classList.toggle('hidden',!show);if(count)count.textContent=String(c.total);btn.classList.toggle('has-alerts',show&&c.total>0);btn.title=show?c.total+' notification(s)':'No approval access';if(menu){const items=notificationItems();menu.innerHTML='<strong>Notifications</strong>'+(c.total?items.map(item=>'<button type="button" data-notification-jump="'+item.key+'"><span>'+item.label+'</span><b>'+item.count+'</b><small>'+item.detail+'</small></button>').join(''):'<div class="notification-empty"><span>All clear</span><small>No requests waiting right now.</small></div>')}}
function openNotificationTarget(key){if(!canEdit()){toast('Only Boss/Admin can approve requests');return}$('#notificationMenu')?.classList.remove('open');if(key==='payments'){openModule('payments');return}if(key==='expiring'){openModule('reminders');return}state.focusApprovals=key==='pauses'?'pauses':'registrations';openModule('customers')}
function openApprovalCenter(){openNotificationTarget('registrations')}
function dashboardRequestCenterHtml(){if(!canEdit())return '';const c=requestCounts();return '<section class="panel request-center-panel"><div class="request-center-head"><div><span class="eyebrow">Approvals</span><h2>Requests Waiting</h2><p>Boss/Admin can review new registrations, payments and pause/resume requests here.</p></div><button class="primary-btn green" id="openApprovalsBtn">Open Requests</button></div><div class="request-grid"><button data-request-open="registrations"><span>New Registrations</span><strong>'+c.registrations+'</strong><small>Review, approve or remove</small></button><button data-request-open="pauses"><span>Pause / Resume</span><strong>'+c.pauses+'</strong><small>Approve or decline</small></button><button data-request-open="expiring"><span>Expiring Soon</span><strong>'+c.expiring+'</strong><small>Renewal follow-up</small></button><button data-request-open="payments"><span>Payments To Approve</span><strong>'+c.payments+'</strong><small>Proof/cash approval</small></button></div></section>'}
function currentBillingPeriod(dateValue=todayIso()){
  const anchor=validDateValue(dateValue)?new Date(dateValue+'T12:00:00'):new Date();
  const start=new Date(anchor);
  if(anchor.getDate()>=6){start.setDate(6)}else{start.setMonth(start.getMonth()-1);start.setDate(6)}
  const end=new Date(start);
  end.setMonth(start.getMonth()+1);
  end.setDate(5);
  const iso=d=>{const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};
  return {start:iso(start),end:iso(end),label:displayDate(iso(start))+' - '+displayDate(iso(end))}
}
function dateDiffDays(from,to=todayIso()){
  if(!validDateValue(from)||!validDateValue(to))return 0;
  const a=new Date(from+'T12:00:00'),b=new Date(to+'T12:00:00');
  return Math.round((a-b)/86400000)
}
function dashboardOverduePayments(){
  const today=todayIso();
  return pendingPaymentCustomers().filter(c=>{
    const p=ensurePaymentRecord(c);
    const due=p.expectedDate||p.dueDate||c.paymentDueDate||c.subscriptionStart||'';
    return validDateValue(due)&&dateDiffDays(due,today)<0
  }).slice(0,5)
}
function dashboardResumeReminders(){
  const today=todayIso();
  const tomorrow=new Date(today+'T12:00:00');
  tomorrow.setDate(tomorrow.getDate()+1);
  const tomorrowIso=isoDate(tomorrow);
  const direct=customers.filter(c=>/paused/i.test(String(c.status||''))&&[today,tomorrowIso].includes(c.resumeDate||''));
  const requests=[];
  customers.forEach(c=>customerPauseRequests(c).forEach(r=>{if(r.status==='Pending'&&/resume/i.test(String(r.type||'')))requests.push(c)}));
  return [...new Set(direct.concat(requests))].slice(0,5)
}
function dashboardPaymentAmountNeeds(){
  return customers.filter(c=>packageById(c.mealPackageId||'').custom||paymentAmount(c)<=0||/custom/i.test(String(c.plan||c.registrationPlanPayment?.packageLabel||''))).slice(0,5)
}
function dashboardViewCustomer(index){
  const i=Number(index);
  if(Number.isFinite(i)&&customers[i]){openCustomerDetails(i);return}
  toast('Customer not found')
}
function dashboardMiniCustomerList(title,items,empty,metaFn){
  const rows=items.length?items.map(c=>{
    const index=customers.indexOf(c);
    return '<div class="dash-focus-row"><div><b>'+escHtml(c.name||'Customer')+'</b><span>'+escHtml(metaFn(c))+'</span></div><button type="button" class="dash-focus-view" data-dashboard-customer="'+index+'">View</button></div>'
  }).join(''):'<div class="dash-focus-empty">'+escHtml(empty)+'</div>';
  return '<article class="dash-focus-card"><h3>'+escHtml(title)+'</h3>'+rows+'</article>'
}
function dashboardManagementFocusHtml(){
  if(!canEdit())return '';
  const stats=dashboardStats();
  const period=currentBillingPeriod(stats.date);
  const pending=pendingCustomers();
  const expiring=expiringCustomers().slice(0,5);
  const overdue=dashboardOverduePayments();
  const resume=dashboardResumeReminders();
  const amountNeeds=dashboardPaymentAmountNeeds();
  const paidRevenue=customers.filter(c=>/^paid$/i.test(paymentStatusText(c))).reduce((sum,c)=>sum+paymentAmount(c),0);
  const urgentCount=pending.length+expiring.length+overdue.length+resume.length+amountNeeds.length;
  return '<section class="dash-management-focus" id="dashboardManagementFocus">'+
    '<div class="dash-urgent-strip '+(urgentCount?'':'clear')+'"><span class="dash-icon">'+dashboardIcon(urgentCount?'alert':'approval')+'</span><div><b>'+(urgentCount?'Urgent Attention Required':'All Clear')+'</b><p>'+urgentCount+' item(s): '+pending.length+' registration, '+expiring.length+' expiring, '+overdue.length+' overdue payment, '+resume.length+' resume reminder, '+amountNeeds.length+' amount review.</p></div><button type="button" class="dash-focus-view" data-dashboard-jump="customers">Open Customers</button></div>'+
    '<article class="dash-billing-card"><div><span class="eyebrow">Billing Period</span><h2>'+escHtml(period.label)+'</h2><p>Monthly cycle starts on the 6th and ends on the 5th. Friday/no-Friday schedules still keep their own package counts.</p></div><div class="dash-billing-metrics"><span><b>'+money(paidRevenue)+'</b><small>Paid revenue</small></span><span><b>'+money(stats.paymentsPending)+'</b><small>Pending amount</small></span><span><b>'+customers.filter(isOperationalCustomer).length+'</b><small>Operational customers</small></span></div></article>'+
    '<div class="dash-focus-grid">'+
      dashboardMiniCustomerList('Expiring Subscriptions',expiring,'No subscriptions expiring in the next 3 days.',c=>(displayDate(c.subscriptionEnd)+' | '+Math.max(0,dateDiffDays(c.subscriptionEnd))+' day(s) left'))+
      dashboardMiniCustomerList('Overdue Payments',overdue,'No overdue payments found.',c=>{const p=ensurePaymentRecord(c);return money(paymentAmount(c))+' | due '+displayDate(p.expectedDate||p.dueDate||c.paymentDueDate||c.subscriptionStart)})+
      dashboardMiniCustomerList('Resume Reminders',resume,'No customers scheduled to resume today or tomorrow.',c=>(c.resumeDate?'Resume '+displayDate(c.resumeDate):'Pending resume request'))+
      dashboardMiniCustomerList('Payment Amount Review',amountNeeds,'No custom package amounts need review.',c=>(packageById(c.mealPackageId||'').label||c.plan||'Custom Package')+' | '+paymentStatusText(c))+
    '</div></section>'
}
function insertDashboardManagementFocus(){
  if($('#dashboardManagementFocus')||!canEdit())return;
  const target=document.querySelector('.premium-dashboard .dash-kpi-grid');
  if(target)target.insertAdjacentHTML('afterend',dashboardManagementFocusHtml())
}
function bindDashboardRequests(){updateRequestBadge();insertDashboardManagementFocus();document.querySelectorAll('[data-dashboard-customer]').forEach(btn=>btn.addEventListener('click',()=>dashboardViewCustomer(btn.dataset.dashboardCustomer)));document.querySelectorAll('[data-dashboard-jump]').forEach(btn=>btn.addEventListener('click',()=>openModule(btn.dataset.dashboardJump)))}
function todayIso(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
function dashboardDate(){const input=$('#dateInput');if(input){if(!input.dataset.liveReady){input.value=todayIso();input.dataset.liveReady='1'}return input.value||todayIso()}return todayIso()}
function isOperationalCustomer(c){return !/paused|expired|stopped|archived|deactivated/i.test(String(c.status||''))}
function dashboardStats(){const date=dashboardDate();const rows=productionRowsForDate(date);const active=customers.filter(isOperationalCustomer);const expired=customers.filter(c=>/expired/i.test(String(c.status||''))).length;const expiring=expiringCustomers().length;const paidCustomers=customers.filter(c=>/^paid$/i.test(paymentStatusText(c)));const pendingCustomersList=pendingPaymentCustomers();const categoryCounts=mealCategories.map(cat=>rows.filter(r=>r.cat===cat[0]).length);const deliveryPackages=new Set(rows.map(r=>String(r.customer||'')+'|'+String(r.packageLabel||dayNameFromDate(date)+' Package')));return {date,totalCustomers:customers.length,activeCustomers:active.length,expiredCustomers:expired,expiringSoon:expiring,mealsToday:rows.length,deliveriesToday:deliveryPackages.size,deliveredToday:0,kitchenNotes:rows.filter(r=>r.note&&r.note!=='No special note').length,paymentsPaid:paidCustomers.reduce((sum,c)=>sum+paymentAmount(c),0),paymentsPending:pendingCustomersList.reduce((sum,c)=>sum+paymentAmount(c),0),averageDailyMeals:0,averageDeliveryTime:'0 min',categoryCounts,rows}}
function updateSidebarStats(){const stats=dashboardStats();const set=(id,value)=>{const el=$('#'+id);if(el)el.textContent=value};set('sideCustomers',stats.totalCustomers);set('sideMeals',stats.mealsToday);set('sideDeliveries',stats.deliveriesToday);set('sideNotes',stats.kitchenNotes)}
function categoryChart(){const stats=dashboardStats();const counts=stats.categoryCounts;const total=counts.reduce((a,b)=>a+b,0);let angle=0;const parts=total?counts.map((count,i)=>{const start=angle;angle+=count/total*360;return colors[i%colors.length]+' '+start.toFixed(2)+'deg '+angle.toFixed(2)+'deg'}).join(','):'#edf2f7 0deg 360deg';return '<section class="panel chart-panel"><div class="panel-header"><div><h2>Meals By Category</h2><span class="sub">Selected date production split</span></div></div><div class="donut-chart-wrap"><div class="round-chart" style="background:conic-gradient('+parts+')"><span>'+total+'<small>Total Meals</small></span></div><div class="round-legend">'+mealCategories.map((c,i)=>'<div><i style="background:'+colors[i%colors.length]+'"></i><strong>'+c[0]+'</strong><span>'+counts[i]+' meals</span></div>').join('')+'</div></div></section>'}
function moduleFrame(title,sub,body){$('#pageTitle').textContent=title;$('#workspace').innerHTML=body;document.body.classList.toggle('customer-mode',state.role==='customer');document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.module===state.module));applyRoleNav();updateSidebarStats();updateRequestBadge();applyI18n()}
function dashboardIcon(name){const icons={customers:'<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',approval:'<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',subs:'<svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>',deliveries:'<svg viewBox="0 0 24 24"><path d="M3 7h11v10H3z"/><path d="M14 11h4l3 3v3h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>',payments:'<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>',notes:'<svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>',chart:'<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="5" width="3" height="12"/></svg>',alert:'<svg viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>',activity:'<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',export:'<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>'};return icons[name]||icons.chart}
function dashKpi(icon,title,value,meta,tone='green',foot=''){return '<article class="dash-kpi '+tone+'"><div class="dash-kpi-top"><span class="dash-icon">'+dashboardIcon(icon)+'</span><b>'+escHtml(title)+'</b></div><strong>'+escHtml(value)+'</strong><div class="dash-kpi-meta"><span>'+escHtml(meta)+'</span>'+(foot?'<em>'+escHtml(foot)+'</em>':'')+'</div></article>'}
function dashDonut(title,total,items,linkText){let angle=0;const sum=items.reduce((a,b)=>a+Number(b.value||0),0);const bg=sum?items.map(item=>{const start=angle;angle+=Number(item.value||0)/sum*360;return item.color+' '+start.toFixed(2)+'deg '+angle.toFixed(2)+'deg'}).join(','):'#eef2f6 0deg 360deg';return '<section class="dash-card dash-donut-card"><div class="dash-card-head"><h2>'+escHtml(title)+'</h2><button class="dash-link" type="button">'+escHtml(linkText)+' <span>&gt;</span></button></div><div class="dash-donut-layout"><div class="dash-donut" style="background:conic-gradient('+bg+')"><span><strong>'+escHtml(total)+'</strong><small>Total</small></span></div><div class="dash-legend">'+items.map(item=>'<div><i style="background:'+item.color+'"></i><span>'+escHtml(item.label)+'</span><b>'+escHtml(item.value)+(item.percent?' ('+escHtml(item.percent)+')':'')+'</b></div>').join('')+'</div></div></section>'}
function dashProgressRows(rows){return '<div class="dash-progress-list">'+rows.map(r=>'<div class="dash-progress-row"><div><span>'+escHtml(r.label)+'</span><b>'+escHtml(r.value)+'</b></div><i><em style="width:'+Math.max(0,Math.min(100,Number(r.percent||0)))+'%;background:'+r.color+'"></em></i></div>').join('')+'</div>'}
function dashTableCard(title,sub,headers,rows,linkText){const displayRows=title==='Recent Activity'?dashboardActivityRows(dashboardDate()):rows;return '<section class="dash-card"><div class="dash-card-head"><div><h2>'+escHtml(title)+'</h2><p>'+escHtml(sub)+'</p></div>'+(linkText?'<button class="dash-link" type="button">'+escHtml(linkText)+' <span>&gt;</span></button>':'')+'</div>'+table(headers,displayRows)+'</section>'}
function activityDateObj(value){if(!value)return null;const d=new Date(value);return Number.isNaN(d.getTime())?null:d}
function activityIso(value){const d=activityDateObj(value);if(!d)return '';d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
function activityTime(value){const d=activityDateObj(value);return d?d.toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'-'}
function collectDashboardActivities(selectedDate){const rows=[];const add=(when,action,details,user)=>{const iso=activityIso(when);if(!iso||iso!==selectedDate)return;rows.push({time:activityDateObj(when)?.getTime()||0,cells:[activityTime(when),action,details,user||'System']})};pendingCustomers().forEach(p=>{const h=p.health||{},n=h.nutrition||{},payment=p.payment||{};add(p.createdAt||p.registeredAt||n.calculatedAt,'New Registration',(p.name||'Customer')+' submitted registration','Customer');add(payment.uploadedDate||payment.proofUploadedAt,'Payment Proof Uploaded',(p.name||'Customer')+' uploaded payment proof','Customer');(p.reviewHistory||[]).forEach(item=>add(item.time,item.action||'Review Activity',item.details||p.name||'Customer',item.by||'CEO/Admin'))});customers.forEach(c=>{const payment=ensurePaymentRecord(c);add(c.createdAt||c.registeredAt||c.joinDate,'Customer Added',(c.name||'Customer')+' added to customer directory','System');add(c.subscriptionStart,'Subscription Started',(c.name||'Customer')+' subscription started',c.approvedBy||'CEO/Admin');add(payment.uploadedDate||payment.proofUploadedAt,'Payment Proof Uploaded',(c.name||'Customer')+' uploaded payment proof','Customer');add(payment.approvedDate||payment.paidAt,'Payment Approved',(c.name||'Customer')+' payment approved by '+(payment.approvedBy||'CEO/Admin'),payment.approvedBy||'CEO/Admin');customerPauseRequests(c).forEach(r=>add(r.createdAt||r.date||r.fromDate,'Pause / Resume Request',(c.name||'Customer')+' requested '+(r.type||r.status||'pause/resume'),r.by||'Customer'));(c.trialTimeline||[]).forEach(item=>add(item.date,item.text||'Trial Timeline',c.name||'Customer','System'));(c.reviewHistory||c.history||[]).forEach(item=>add(item.time||item.date,item.action||'Customer Activity',item.details||c.name||'Customer',item.by||'System'))});return rows.sort((a,b)=>b.time-a.time)}
function dashboardActivityRows(selectedDate){const rows=collectDashboardActivities(selectedDate).slice(0,8).map(r=>r.cells);return rows.length?rows:[['-','No activity for selected date','Real customer actions will appear here after registrations, payments, approvals or pause requests are recorded.','-']]}
function dashAlertList(rows){return '<section class="dash-card dash-alert-card"><div class="dash-card-head"><div><h2>Alerts & Notifications</h2><p>Important customer and operation follow-up</p></div><button class="dash-link" type="button">View All Alerts <span>&gt;</span></button></div><div class="dash-alert-list">'+rows.map(r=>'<div class="dash-alert-item '+r.tone+'"><span class="dash-icon">'+dashboardIcon(r.icon)+'</span><div><b>'+escHtml(r.title)+'</b><small>'+escHtml(r.sub)+'</small></div><strong>'+escHtml(r.count)+'</strong></div>').join('')+'</div></section>'}function renderDashboard(){state.module='dashboard';const full=canEdit();const stats=dashboardStats();const req=requestCounts();const active=Math.max(0,stats.activeCustomers);const total=Math.max(1,stats.totalCustomers);const trial=customers.filter(c=>/trial/i.test(String(c.trialStatus||c.status||c.paymentStatus||''))).length;const paused=customers.filter(c=>/paused/i.test(String(c.status||''))).length;const expired=stats.expiredCustomers;const pendingApprovals=req.registrations;const pendingPayments=pendingPaymentCustomers().length;const subscriptions=customers.filter(isOperationalCustomer).length;const delivered=stats.deliveredToday;const scheduled=stats.deliveriesToday;const categoryTotal=Math.max(1,stats.categoryCounts.reduce((a,b)=>a+b,0));const categoryItems=mealCategories.slice(0,6).map((c,i)=>({label:c[0]+' ('+c[1]+'P/'+c[2]+'C)',value:stats.categoryCounts[i]||0,color:colors[i%colors.length],percent:Math.round((stats.categoryCounts[i]||0)/categoryTotal*100)+'%'}));const customerStatusItems=[{label:'Active',value:active,color:'#0f8f57',percent:Math.round(active/total*100)+'%'},{label:'Trial',value:trial,color:'#68c47c',percent:Math.round(trial/total*100)+'%'},{label:'Pending Approval',value:pendingApprovals,color:'#f6a81a',percent:Math.round(pendingApprovals/total*100)+'%'},{label:'Paused',value:paused,color:'#e3425f',percent:Math.round(paused/total*100)+'%'},{label:'Expired',value:expired,color:'#a6b0bd',percent:Math.round(expired/total*100)+'%'}];const paymentItems=[{label:'Paid',value:customers.filter(c=>/^paid$/i.test(paymentStatusText(c))).length,color:'#0f8f57'},{label:'Payment Uploaded',value:customers.filter(c=>/proof uploaded|payment uploaded|waiting admin approval/i.test(paymentStatusText(c))).length,color:'#1f78d1'},{label:'Pending Verification',value:pendingPayments,color:'#f6a81a'},{label:'Not Paid',value:customers.filter(c=>/not paid|pending|overdue/i.test(paymentStatusText(c))).length,color:'#e3425f'}];const recentCustomers=customers.slice(0,5);const recentRows=(recentCustomers.length?recentCustomers:[[null]]).map((c,i)=>c?[c.name||'-',c.phone||'-',badge(c.cat||'A',i),c.area||'-',pill(paymentStatusText(c)||c.status||'Active')]:['No customers yet','-','-','-','-']);const activityRows=[['Today','Dashboard Reviewed','CEO/Admin checked operation dashboard',roles[state.role]?.label||'System'],['Today','Production Count',stats.mealsToday+' meal portions calculated for selected date','System'],['Today','Payment Follow-up',pendingPayments+' payment item(s) need review','System'],['Today','Delivery Planning',scheduled+' delivery route(s) listed','Transportation']];const alertRows=[{icon:'approval',title:pendingApprovals+' customers pending approval',sub:'New registrations require review',count:pendingApprovals,tone:'warn'},{icon:'subs',title:stats.expiringSoon+' subscriptions expiring soon',sub:'In next 3 days',count:stats.expiringSoon,tone:'danger'},{icon:'payments',title:pendingPayments+' payments pending verification',sub:'Proof/cash approval waiting',count:pendingPayments,tone:'info'},{icon:'notes',title:stats.kitchenNotes+' kitchen notes today',sub:'Special meal instructions',count:stats.kitchenNotes,tone:'success'}];const packageRows=mealSelectionPackages.filter(p=>!p.custom).slice(0,7).map(pkg=>{const list=customers.filter(c=>(c.mealPackageId||'3m1s')===pkg.id);return [pkg.label,list.length,money((pkg.price||0)*list.length),pill(list.length?'Active':'0')]});const categoryCards='<section class="dash-card dash-category-card"><div class="dash-card-head"><div><h2>Customer Category Summary</h2><p>Cooked portion categories by customer plan</p></div><button class="dash-link" type="button">View Category Details <span>></span></button></div><div class="dash-category-grid">'+mealCategories.slice(0,6).map((c,i)=>'<article style="--cat-color:'+colors[i%colors.length]+'"><b>'+c[0]+'</b><span>'+c[1]+'P / '+c[2]+'C</span><strong>'+stats.categoryCounts[i]+'</strong><small>Meals today</small></article>').join('')+'</div></section>';const quickActions='<section class="dash-card"><div class="dash-card-head"><div><h2>Quick Actions</h2><p>Fast access for daily operations</p></div></div><div class="dash-action-grid"><button type="button" onclick="openNotificationTarget(\'registrations\')"><span class="dash-icon">'+dashboardIcon('approval')+'</span><b>Review Customers</b><small>Approve new registrations</small></button><button type="button" onclick="openModule(\'kitchen\')"><span class="dash-icon">'+dashboardIcon('notes')+'</span><b>Kitchen Reports</b><small>Quantity and notes sheets</small></button><button type="button" onclick="openModule(\'delivery\')"><span class="dash-icon">'+dashboardIcon('deliveries')+'</span><b>Delivery Routes</b><small>Driver and zone planning</small></button><button type="button" onclick="openModule(\'payments\')"><span class="dash-icon">'+dashboardIcon('payments')+'</span><b>Payments</b><small>Verify receipt/cash</small></button></div></section>';const body='<section class="premium-dashboard"><div class="dash-hero"><div><span class="eyebrow">Triangle Operations</span><h1>Dashboard</h1><p>Welcome back, '+escHtml(roles[state.role]?.label||'Team')+'. Here is your customer, nutrition, subscription and delivery overview.</p></div><div class="dash-hero-actions"><button class="primary-btn light" type="button">'+displayDate(stats.date)+'</button><button class="primary-btn green" type="button" onclick="window.print()"><span class="btn-icon">'+dashboardIcon('export')+'</span>Export Report</button></div></div><div class="dash-kpi-grid">'+dashKpi('customers','Total Customers',stats.totalCustomers,'Active customers '+active,'green')+dashKpi('approval','Pending Approvals',pendingApprovals,'New registrations '+pendingApprovals,'orange')+dashKpi('subs','Active Subscriptions',subscriptions,'This month','green','+'+Math.max(0,subscriptions-paused))+dashKpi('alert','Expiring Soon',stats.expiringSoon,'In next 3 days','red')+dashKpi('deliveries',"Today's Deliveries",scheduled,'Scheduled '+scheduled,'blue')+dashKpi('payments','Pending Payments',pendingPayments,'Total amount '+money(stats.paymentsPending),'purple')+'</div><div class="dash-chart-grid">'+dashDonut('Customer Overview',stats.totalCustomers,customerStatusItems,'View All Customers')+dashDonut('Category Distribution',subscriptions,categoryItems,'View Category Report')+categoryCards+'</div><div class="dash-mid-grid"><section class="dash-card"><div class="dash-card-head"><div><h2>Subscription Status</h2><p>Current lifecycle split</p></div><button class="dash-link" type="button">View Subscriptions <span>></span></button></div>'+dashProgressRows([{label:'Active',value:active+' ('+Math.round(active/total*100)+'%)',percent:active/total*100,color:'#0f8f57'},{label:'Trial',value:trial+' ('+Math.round(trial/total*100)+'%)',percent:trial/total*100,color:'#68c47c'},{label:'Paused',value:paused+' ('+Math.round(paused/total*100)+'%)',percent:paused/total*100,color:'#f6a81a'},{label:'Expired',value:expired+' ('+Math.round(expired/total*100)+'%)',percent:expired/total*100,color:'#e3425f'}])+'</section>'+dashDonut('Payment Overview',stats.totalCustomers,paymentItems,'View Payments')+dashTableCard("Today's Deliveries",'Live delivery status by stage',['Status','Count','Share'],[['Delivered',delivered,scheduled?Math.round(delivered/Math.max(1,scheduled)*100)+'%':'0%'],['In Progress',Math.max(0,scheduled-delivered),scheduled?Math.round((scheduled-delivered)/Math.max(1,scheduled)*100)+'%':'0%'],['Pending',pendingApprovals,'Needs review'],['Failed / Returned',0,'0%']],'View Deliveries')+'</div><div class="dash-bottom-grid">'+dashAlertList(alertRows)+dashTableCard('Recent Activity','Latest operational events',['Date & Time','Action','Details','User'],activityRows,'View Full Activity Log')+'</div><div class="dash-bottom-grid two">'+dashTableCard('Recent Customers','Latest customer records',['Customer','Phone','Category','Area','Status'],recentRows,'View All')+dashTableCard('Package Revenue Snapshot','Package customers and expected revenue',['Package','Customers','Expected','Status'],packageRows,'View Packages')+'</div><div class="dash-bottom-grid two">'+quickActions+dashTableCard('Daily Kitchen Snapshot','Selected date production totals',['Area','Current Numbers','Status'],[['Meals Going Today',stats.mealsToday,pill(stats.mealsToday?'Ready':'0')],['Kitchen Notes',stats.kitchenNotes,pill(stats.kitchenNotes?'Needs Care':'Clear')],['Payments Pending',money(stats.paymentsPending),pill(stats.paymentsPending?'Pending':'Clear')],['Average Delivery Time',stats.averageDeliveryTime,pill('Live')]],'Open Reports')+'</div></section>';moduleFrame('Triangle Healthy Kitchen Dashboard','',body);bindDashboardRequests()}
function zoneOptions(selected){return Object.keys(qatarZones).map(z=>'<option value="'+escAttr(z)+'" '+(z===selected?'selected':'')+'>'+escHtml(zoneShort(z))+' - '+escHtml(z.replace(/^Zone \d+ - /,''))+' ('+(qatarZones[z]||[]).length+' area'+((qatarZones[z]||[]).length===1?'':'s')+')</option>').join('')}
function areaOptions(zone,selected){const areas=[...new Set(qatarZones[zone]||[])];const chosen=areas.includes(selected)?selected:areas[0];return areas.map(a=>'<option value="'+escAttr(a)+'" '+(a===chosen?'selected':'')+'>'+escHtml(a)+'</option>').join('')}
function zoneAreaHint(zone){const areas=qatarZones[zone]||[];return areas.length?'Choose your exact area below. '+areas.length+' area'+(areas.length===1?'':'s')+' available in '+zoneShort(zone)+'.':'Select a Qatar zone number to see its areas'}
function refreshAreaSelect(zoneEl,areaEl,hintEl){if(!zoneEl||!areaEl)return;const current=areaEl.value;areaEl.innerHTML=areaOptions(zoneEl.value,current);if(hintEl)hintEl.textContent=zoneAreaHint(zoneEl.value)}
const deliveryTimeSlots=['05:00 AM','05:30 AM','06:00 AM','06:30 AM','07:00 AM','07:30 AM','08:00 AM','08:30 AM','09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM'];
function deliverySlotLabel(value){return String(value||'').replace(/^0/,'')}
function zoneNameOnly(zone){return String(zone||'').replace(/^Zone \d+\s*-\s*/,'')}
function zoneSearchOptions(selected,query=''){const q=normalizeLocationText(query);const keys=Object.keys(qatarZones);const filtered=q?keys.filter(z=>normalizeLocationText(z+' '+(qatarZones[z]||[]).join(' ')).includes(q)):keys;const list=filtered.length?filtered:keys;return list.map(z=>'<option value="'+escAttr(z)+'">'+escHtml(zoneShort(z))+' - '+escHtml(zoneNameOnly(z))+'</option>').join('')}
function zoneNumberOf(value){const match=String(value||'').match(/\bzone\s*(\d+)\b|^\s*(\d+)\s*$/i);return match?String(match[1]||match[2]).replace(/^0+/,''):''}
function resolveZoneInput(value){const raw=String(value||'').trim();const keys=Object.keys(qatarZones);if(qatarZones[raw])return raw;const number=zoneNumberOf(raw);if(number){const exact=keys.find(z=>zoneShort(z).replace(/\D/g,'')===number);if(exact)return exact}const q=normalizeLocationText(raw);if(!q)return '';return keys.find(z=>normalizeLocationText(zoneShort(z)+' '+zoneNameOnly(z)).includes(q)||normalizeLocationText((qatarZones[z]||[]).join(' ')).includes(q))||''}
function syncZoneNameField(){const zone=$('#regZone');const name=$('#regZoneName');if(!name||!zone)return;const resolved=resolveZoneInput(zone.value);name.value=resolved?zoneNameOnly(resolved):''}
function applyRegisterZoneInput(force=false){const zone=$('#regZone');const area=$('#regArea');const hint=$('#regAreaHint');if(!zone)return '';const resolved=resolveZoneInput(zone.value);if(resolved&&(force||qatarZones[zone.value]||zoneNumberOf(zone.value))){zone.value=resolved}const active=qatarZones[zone.value]?zone.value:resolved;syncZoneNameField();if(active&&area){const proxy={value:active};refreshAreaSelect(proxy,area,hint)}else if(hint){hint.textContent='Search and select a Qatar zone number to see its areas'}renderDeliverySummary();renderRegisterSummary();return active}
function refreshRegisterZoneSearch(){const list=$('#regZoneList');if(list)list.innerHTML=zoneSearchOptions(Object.keys(qatarZones)[0]);applyRegisterZoneInput(true)}
function registerDeliveryAddress(){const street=$('#regStreetNumber')?.value.trim()||'';const building=$('#regBuildingNumber')?.value.trim()||'';const floor=$('#regFloorNumber')?.value.trim()||'';const unit=$('#regUnitNumber')?.value.trim()||'';const parts=[];if(street)parts.push('Street '+street);if(building)parts.push('Building '+building);if(floor)parts.push('Floor '+floor);if(unit)parts.push('Apartment/Villa '+unit);return {streetNumber:street,buildingNumber:building,floorNumber:floor,unitNumber:unit,fullAddress:parts.join(', ')}}
function syncDeliveryAddressFields(){const address=registerDeliveryAddress();const legacy=$('#regAddress');if(legacy)legacy.value=address.fullAddress;return address}
function renderDeliverySummary(){syncDeliveryAddressFields();const map=$('#regLocation')?.value.trim()||'';const mapStatusEl=$('#regMapStatus');if(mapStatusEl)mapStatusEl.textContent=map?'Map link added':'Map link not added'}
function setDeliveryTimeSlot(value){const input=$('#regDeliveryTime');if(input)input.value=value;fillDeliveryTimeSlots();closeDeliveryTimeSheet();renderDeliverySummary();renderRegisterSummary()}
function fillDeliveryTimeSlots(){const wrap=$('#deliveryTimeSlots');if(!wrap)return;const selected=$('#regDeliveryTime')?.value||'08:30 AM';wrap.innerHTML=deliveryTimeSlots.map(slot=>'<button type="button" class="delivery-time-slot '+(slot===selected?'active':'')+'" data-delivery-slot="'+escAttr(slot)+'">'+escHtml(deliverySlotLabel(slot))+'</button>').join('')}
function openDeliveryTimeSheet(){fillDeliveryTimeSlots();const sheet=$('#deliveryTimeSheet');if(sheet)sheet.hidden=false}
function closeDeliveryTimeSheet(){const sheet=$('#deliveryTimeSheet');if(sheet)sheet.hidden=true}
function bindDeliveryPreferenceTools(){const timeBtn=$('#openDeliveryTimeSheet');if(timeBtn&&!timeBtn.dataset.bound){timeBtn.dataset.bound='yes';timeBtn.addEventListener('click',openDeliveryTimeSheet)}document.querySelectorAll('[data-close-delivery-time]').forEach(btn=>{if(btn.dataset.bound)return;btn.dataset.bound='yes';btn.addEventListener('click',closeDeliveryTimeSheet)});const slotWrap=$('#deliveryTimeSlots');if(slotWrap&&!slotWrap.dataset.bound){slotWrap.dataset.bound='yes';slotWrap.addEventListener('click',e=>{const btn=e.target.closest('[data-delivery-slot]');if(btn)setDeliveryTimeSlot(btn.dataset.deliverySlot)})}const mapBtn=$('#regLocationBtn');if(mapBtn&&!mapBtn.dataset.bound){mapBtn.dataset.bound='yes';mapBtn.addEventListener('click',()=>window.open('https://www.google.com/maps/search/?api=1&query=Qatar','_blank','noopener'))}['#regStreetNumber','#regBuildingNumber','#regFloorNumber','#regUnitNumber','#regDeliveryNote','#regLocation'].forEach(sel=>{const el=$(sel);if(el&&!el.dataset.deliveryBound){el.dataset.deliveryBound='yes';el.addEventListener('input',()=>{if(sel==='#regLocation')applyLocationZoneArea();syncDeliveryAddressFields();renderDeliverySummary();renderRegisterSummary()})}})}
function normalizeLocationText(value){let text=String(value||'').replace(/\+/g,' ');try{text=decodeURIComponent(text)}catch(e){}return text.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function googleLocationSearchText(value){const raw=String(value||'').trim();const parts=[raw];try{const url=new URL(raw);parts.push(url.pathname,url.search);['q','query','destination','daddr','ll','center'].forEach(key=>{const v=url.searchParams.get(key);if(v)parts.push(v)});url.searchParams.forEach(v=>parts.push(v))}catch(e){}return parts.join(' ')}
const qatarAreaAliases={
 'Mushayrib':['msheireb','msheireb downtown','musherib'],
 'The Pearl':['pearl qatar','the pearl qatar','porto arabia','qanat quartier','viva bahriya','medina centrale'],
 'West Bay':['westbay','west bay doha'],
 'Al Dafna':['dafna'],
 'Al Rayyan':['rayyan','alrayyan','ar rayyan'],
 'Education City':['qatar foundation','education city qatar'],
 'Al Wakrah':['wakra','wakrah','alwakrah'],
 'Al Wukair':['wukair','alwukair'],
 'Lusail':['lusail city','lusail qatar'],
 'Al Khor':['alkhor','khor qatar'],
 'Umm Salal Mohammed':['umm salal mohammed','umm salal muhammad'],
 'Umm Salal Ali':['umm salal ali'],
 'Al Shahaniya':['shahaniya','sheehaniya','al sheehaniya'],
 'Old Airport':['old airport doha'],
 'Industrial Area':['industrial area doha'],
 'Al Sadd':['alsadd','al sadd doha'],
 'Duhail':['duhail doha'],
 'Fereej Bin Mahmoud':['bin mahmoud'],
 'Ad Dawhah Al Jadidah':['doha jadeeda','new doha'],
 'Al Gharrafa':['gharafa','gharrafa','gharrafat al rayyan'],
 'Al Waab':['alwaab','waab'],
 'Muaither':['muaither','muaither qatar'],
 'Abu Hamour':['abu hamour','abuhamour'],
 'Al Thumama':['thumama','althumama'],
 'Al Maamoura':['maamoura','mamoura'],
 'Leqtaifiya':['legtaifiya'],
 'Ar Ruays':['al ruwais','ruwais'],
 'Al Shahaniya City':['al shahaniya','al sheehaniya','sheehaniya','shahaniya'],
 'Al Mashaf':['mashaf','almashaf'],
 'Dukhan':['dukhan qatar'],
 'Mesaieed':['mesaieed','mesaied']
};
function areaSearchKeys(area){return [area].concat(qatarAreaAliases[area]||[]).map(normalizeLocationText).filter(Boolean)}
function detectZoneAreaFromLocation(value){const text=normalizeLocationText(googleLocationSearchText(value));if(!text)return null;const matches=Object.entries(qatarZones).flatMap(([zone,areas])=>areas.flatMap(area=>areaSearchKeys(area).map(key=>({zone,area,key})))).sort((a,b)=>b.key.length-a.key.length);return matches.find(item=>item.key&&new RegExp('(^| )'+item.key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'( |$)').test(text))||null}
const qatarCoordinateAreas=[
 {zone:'Zone 61 - Al Dafna & Al Qassar',area:'West Bay',lat:25.326,lng:51.530},{zone:'Zone 3 - Fereej Mohamed Bin Jasim & Mushayrib',area:'Msheireb',lat:25.286,lng:51.526},{zone:'Zone 38 - Al Sadd',area:'Al Sadd',lat:25.285,lng:51.495},{zone:'Zone 45 - Old Airport',area:'Old Airport',lat:25.260,lng:51.550},{zone:'Zone 26 - Najma',area:'Najma',lat:25.270,lng:51.545},
 {zone:'Zone 66 - Onaiza, Leqtaifiya & Al Qassar',area:'The Pearl',lat:25.371,lng:51.551},{zone:'Zone 66 - Onaiza, Leqtaifiya & Al Qassar',area:'Katara',lat:25.360,lng:51.526},{zone:'Zone 69 - Lusail, Al Egla & Wadi Al Banat',area:'Lusail',lat:25.418,lng:51.514},{zone:'Zone 30 - Duhail',area:'Duhail',lat:25.362,lng:51.470},{zone:'Zone 70 - Al Daayen, Al Kheesa & Umm Qarn',area:'Al Daayen',lat:25.578,lng:51.482},
 {zone:'Zone 53 - New Al Rayyan, Al Wajbah & Muaither',area:'New Al Rayyan',lat:25.291,lng:51.424},{zone:'Zone 52 - Al Luqta, Lebday & Old Al Rayyan',area:'Al Luqta',lat:25.316,lng:51.439},{zone:'Zone 55 - Al Waab, Al Aziziya, Bu Sidra & Al Sailiya',area:'Al Waab',lat:25.253,lng:51.480},{zone:'Zone 53 - New Al Rayyan, Al Wajbah & Muaither',area:'Muaither',lat:25.264,lng:51.396},{zone:'Zone 51 - Al Gharrafa, Bani Hajer & Rawdat Egdaim',area:'Al Gharrafa',lat:25.327,lng:51.441},
 {zone:'Zone 90 - Al Wakrah',area:'Al Wakrah',lat:25.171,lng:51.603},{zone:'Zone 91 - Al Thumama, Al Wukair & Al Mashaf',area:'Al Wukair',lat:25.151,lng:51.537},{zone:'Zone 91 - Al Thumama, Al Wukair & Al Mashaf',area:'Al Mashaf',lat:25.101,lng:51.514},{zone:'Zone 92 - Mesaieed',area:'Mesaieed',lat:24.990,lng:51.550},
 {zone:'Zone 71 - Umm Salal',area:'Umm Salal Mohammed',lat:25.416,lng:51.406},{zone:'Zone 71 - Umm Salal',area:'Umm Salal Ali',lat:25.469,lng:51.397},{zone:'Zone 74 - Simaisma, Al Jeryan & Al Khor City',area:'Al Khor',lat:25.684,lng:51.505},{zone:'Zone 79 - Madinat Ash Shamal & Ar Ruays',area:'Madinat Ash Shamal',lat:26.129,lng:51.214},
 {zone:'Zone 80 - Al Shahaniya City',area:'Al Shahaniya',lat:25.408,lng:51.186},{zone:'Zone 86 - Dukhan',area:'Dukhan',lat:25.424,lng:50.783},{zone:'Zone 84 - Umm Bab',area:'Umm Bab',lat:25.214,lng:50.807},{zone:'Zone 83 - Al Karaana',area:'Al Karaana',lat:25.028,lng:51.043}
];
function distanceSq(a,b){const lat=(a.lat-b.lat)*111;const lng=(a.lng-b.lng)*111*Math.cos((a.lat+b.lat)/2*Math.PI/180);return lat*lat+lng*lng}
function detectZoneAreaFromCoordinates(coords){if(!coords||!Number.isFinite(coords.lat)||!Number.isFinite(coords.lng))return null;if(coords.lat<24.45||coords.lat>26.25||coords.lng<50.65||coords.lng>51.75)return null;return qatarCoordinateAreas.slice().sort((a,b)=>distanceSq(coords,a)-distanceSq(coords,b))[0]||null}
function googleMapsApiKey(){return String(window.THK_GOOGLE_MAPS_API_KEY||localStorage.getItem('triangleGoogleMapsApiKey')||'').trim()}
let googleMapsApiPromise=null;
function loadGoogleMapsApi(){if(window.google?.maps?.Geocoder)return Promise.resolve();const key=googleMapsApiKey();if(!key)return Promise.reject(new Error('missing-google-key'));if(googleMapsApiPromise)return googleMapsApiPromise;googleMapsApiPromise=new Promise((resolve,reject)=>{const existing=document.querySelector('script[data-thk-google-maps]');if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}const script=document.createElement('script');script.dataset.thkGoogleMaps='true';script.async=true;script.defer=true;script.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(key)+'&libraries=places';script.onload=resolve;script.onerror=()=>reject(new Error('google-maps-load-failed'));document.head.appendChild(script)});return googleMapsApiPromise}
function extractGoogleCoordinates(value){const text=String(value||'');const patterns=[/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,/[?&](?:q|ll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,/^\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\s*$/];for(const pattern of patterns){const match=text.match(pattern);if(match)return {lat:Number(match[1]),lng:Number(match[2])}}return null}
function isShortGoogleMapsLink(value){return /maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs/i.test(String(value||''))}
function googleGeocode(request){return new Promise((resolve,reject)=>{const geocoder=new google.maps.Geocoder();geocoder.geocode(request,(results,status)=>{if(status==='OK'&&results?.length)return resolve(results);reject(new Error(status||'geocode-failed'))})})}
async function googleReadableLocation(value){await loadGoogleMapsApi();const coords=extractGoogleCoordinates(value);const results=coords?await googleGeocode({location:coords}):await googleGeocode({address:String(value||'')});return results.map(result=>[result.formatted_address,(result.address_components||[]).map(c=>c.long_name).join(' ')].join(' ')).join(' ')}
function setDetectedZoneArea(match,message){const zone=$('#regZone');const area=$('#regArea');const hint=$('#regLocationHint');if(!zone||!area||!match)return false;zone.value=match.zone;syncZoneNameField();refreshAreaSelect(zone,area,$('#regAreaHint'));area.value=match.area;if(hint)hint.textContent=message||('Detected '+match.area+' in '+zoneShort(match.zone));renderDeliverySummary();renderRegisterSummary();return true}
async function applyLocationZoneArea(){const zone=$('#regZone');const area=$('#regArea');const hint=$('#regLocationHint');if(!zone||!area)return false;const source=[$('#regLocation')?.value,$('#regAddress')?.value,$('#regStreetNumber')?.value,$('#regBuildingNumber')?.value,$('#regFloorNumber')?.value,$('#regUnitNumber')?.value].filter(Boolean).join(' ');if(!source){if(hint)hint.textContent='';renderDeliverySummary();return false}const directMatch=detectZoneAreaFromLocation(source);if(directMatch)return setDetectedZoneArea(directMatch,'Detected '+directMatch.area+' in '+zoneShort(directMatch.zone));const coords=extractGoogleCoordinates(source);const coordMatch=detectZoneAreaFromCoordinates(coords);if(coordMatch&&!googleMapsApiKey())return setDetectedZoneArea(coordMatch,'Estimated from map coordinates: '+coordMatch.area+' in '+zoneShort(coordMatch.zone));if(!googleMapsApiKey()){if(hint)hint.textContent=isShortGoogleMapsLink(source)?'Google short link saved. Short links hide the location details, so please paste a full Google Maps link/address or choose zone and area manually.':'Map link saved. Area name was not found in the text, so please choose zone and area manually.';renderDeliverySummary();return false}if(hint)hint.textContent='Checking Google Maps area...';try{const readable=await googleReadableLocation(source);const googleMatch=detectZoneAreaFromLocation(readable+' '+source);if(googleMatch)return setDetectedZoneArea(googleMatch,'Google Maps detected '+googleMatch.area+' in '+zoneShort(googleMatch.zone));if(coordMatch)return setDetectedZoneArea(coordMatch,'Estimated from map coordinates: '+coordMatch.area+' in '+zoneShort(coordMatch.zone));if(hint)hint.textContent='Google Maps checked this location, but the area is not in our Qatar area list. Please choose zone and area manually.'}catch(e){if(coordMatch)return setDetectedZoneArea(coordMatch,'Estimated from map coordinates: '+coordMatch.area+' in '+zoneShort(coordMatch.zone));if(hint)hint.textContent=isShortGoogleMapsLink(source)?'Google short links cannot be opened by this local page. Please paste a full Google link/address or choose zone and area manually.':'Google Maps could not detect this area. Please choose zone and area manually.'}renderDeliverySummary();return false}
function mapsLink(area,address){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent((address||area||'Qatar')+', Qatar')}
function customerMapLink(c){return c?.googleLocation||mapsLink(c?.area,c?.address)}
function googleMapEmbed(area,address){return 'https://www.google.com/maps?q='+encodeURIComponent((address||area||'Qatar')+', Qatar')+'&output=embed'}
function bindZoneArea(scope=document){const zone=scope.querySelector('#detailZone, #deliveryZone');const area=scope.querySelector('#detailArea, #deliveryArea');if(!zone||!area)return;const refresh=()=>{refreshAreaSelect(zone,area);const driver=scope.querySelector('#detailDriver,#deliveryDriver');if(driver){const c=driver.id==='detailDriver'?customers[selectedCustomerIndex]:null;driver.value=c?.driverOverride||assignedDriver(zone.value)}};zone.addEventListener('change',refresh);refresh();}
let selectedCustomerIndex=0;
function formatSelectedOptions(type,value){const arr=Array.isArray(value)?value:(value?[value]:[]);return arr.length?arr.map(v=>Number(v)?'Option '+v:String(v)).join(', '):'-'}
function customerAdjustments(c){return Array.isArray(c.adjustments)?c.adjustments:[]}
function adjustmentCustomerKey(c){return 'triangleCustomerAdjustments_'+String(c.phone||c.name||'customer').replace(/[^a-z0-9]/gi,'_')}
function loadCustomerAdjustments(){customers.forEach(c=>{try{const saved=JSON.parse(localStorage.getItem(adjustmentCustomerKey(c))||'null');if(Array.isArray(saved))c.adjustments=saved}catch(e){console.warn('Adjustment restore skipped',e)}})}
function saveCustomerAdjustments(c){localStorage.setItem(adjustmentCustomerKey(c),JSON.stringify(customerAdjustments(c)))}
function adjustmentHistoryHtml(c,edit){const rows=customerAdjustments(c).map((a,i)=>{const base=[escHtml(a.effectiveDate||'-'),escHtml(a.type||'-'),escHtml(a.oldValue||'-'),escHtml(a.newValue||'-'),escHtml(a.balance||'-'),escHtml(a.reason||'-'),escHtml(a.by||'-')];return edit?[...base,'<button type="button" class="primary-btn danger remove-adjustment" data-adjust-index="'+i+'">Remove</button>']:base});return rows.length?table(edit?['From Date','Change','Old','New','Balance','Reason','By','Action']:['From Date','Change','Old','New','Balance','Reason','By'],rows):'<div class="locked-panel"><h2>No Adjustments Yet</h2><p>Friday/package changes will appear here after Boss/Admin adds them.</p></div>'}
function adjustmentManagerHtml(c,edit){const dis=edit?'':'disabled';return '<section class="adjustment-box"><div class="panel-header"><div><h2>Subscription Adjustment History</h2><span class="sub">Old service stays recorded. Future changes start from the selected date.</span></div></div>'+adjustmentHistoryHtml(c,edit)+(edit?'<div class="adjustment-form"><label><span>Effective From</span><input id="adjustEffectiveDate" type="date" value="'+new Date().toISOString().slice(0,10)+'"></label><label><span>Change Type</span><select id="adjustType"><option>Friday Delivery Change</option><option>Meal Package Change</option><option>Friday + Meal Package Change</option><option>Payment / Balance Note</option></select></label><label><span>Friday Delivery</span><select id="adjustFriday"><option value="same">No change</option><option value="include">Include Friday</option><option value="stop">Stop Friday</option></select></label><label><span>Meal Package</span><select id="adjustMealPackage"><option value="same">No change</option>'+mealSelectionPackages.map(p=>'<option value="'+p.id+'">'+p.label+'</option>').join('')+'</select></label><label><span>Balance / Credit Note</span><input id="adjustBalance" placeholder="Example: 2 Friday meals credited"></label><label><span>Reason</span><input id="adjustReason" placeholder="Customer requested future change"></label><button type="button" class="primary-btn green" id="addAdjustment">Add Adjustment</button></div>':'')+'</section>'}
function bindAdjustmentActions(editable){if(!editable)return;document.querySelectorAll('.remove-adjustment').forEach(btn=>btn.addEventListener('click',()=>{const c=customers[selectedCustomerIndex];const i=Number(btn.dataset.adjustIndex);if(!c||!customerAdjustments(c)[i])return;c.adjustments.splice(i,1);saveCustomerAdjustments(c);toast('Adjustment removed');renderCustomers()}));$('#addAdjustment')?.addEventListener('click',()=>{const c=customers[selectedCustomerIndex];if(!c)return;const oldFriday=customerHasFriday(c)?'Friday included':'Friday not included';const oldMeal=packageById(c.mealPackageId||'3m1s').label;const friday=$('#adjustFriday')?.value||'same';const meal=$('#adjustMealPackage')?.value||'same';const changes=[];if(friday!=='same'){c.includeFriday=friday==='include';changes.push((friday==='include'?'Include Friday':'Stop Friday'))}if(meal!=='same'){c.mealPackageId=meal;changes.push('Meal package to '+packageById(meal).label)}const newFriday=customerHasFriday(c)?'Friday included':'Friday not included';const newMeal=packageById(c.mealPackageId||'3m1s').label;const type=$('#adjustType')?.value||'Subscription Change';const record={effectiveDate:$('#adjustEffectiveDate')?.value||new Date().toISOString().slice(0,10),type,oldValue:oldFriday+' / '+oldMeal,newValue:(changes.length?changes.join(' + '):newFriday+' / '+newMeal),balance:$('#adjustBalance')?.value||'To review',reason:$('#adjustReason')?.value||'Customer requested change',by:roles[state.role]?.label||'Admin'};c.adjustments=customerAdjustments(c);c.adjustments.unshift(record);saveCustomerAdjustments(c);toast('Adjustment added from '+record.effectiveDate);renderCustomers()})}
function menuUiIcon(name){const icons={save:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h12l2 2v16H5z"/><path d="M8 3v6h8V3"/><path d="M8 17h8"/></svg>',week:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="M9 15l2 2 4-5"/></svg>',Breakfast:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5z"/><path d="M15 12h2.5a2 2 0 0 1 0 4H15"/><path d="M7 4c0 1.5 2 1.5 2 3s-2 1.5-2 3M12 4c0 1.5 2 1.5 2 3s-2 1.5-2 3"/></svg>',Lunch:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 16 0"/><path d="M3 12h18"/><path d="M5 16h14"/><path d="M8 20h8"/></svg>',Dinner:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14l-1 6H6z"/><path d="M8 12V8a4 4 0 0 1 8 0v4"/><path d="M4 18h16"/></svg>',Snacks:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8h10l-1 12H8z"/><path d="M9 8V5h6v3"/><path d="M9 12h6M10 16h4"/></svg>'};return '<span class="menu-svg menu-svg-'+String(name).toLowerCase()+'">'+(icons[name]||icons.week)+'</span>'}
function menuTypeIcon(type){return menuUiIcon(type)}
function weekPlannerHtml(c,edit){const weeks=c.weeks||defaultWeekSelections();const pkg=c.mealPackageId||'3m1s';const limits=packageLimits(pkg);const types=['Breakfast','Lunch','Dinner','Snacks'];const hasFriday=customerHasFriday(c);return '<div class="week-planner" data-package="'+pkg+'" data-friday="'+(hasFriday?'yes':'no')+'"><div class="planner-head"><strong>4 Week Menu Selection</strong><span>'+limits.label+' - choose only '+limits.meals+' meal(s) and '+limits.snacks+' snack(s) per week'+(hasFriday?' - Friday included for this customer':' - Friday not included')+'</span></div><div class="week-tab-row">'+weeks.map((weekItem,weekIndex)=>'<button type="button" class="week-tab-btn '+(weekIndex===0?'active':'')+'" data-target-week="'+weekItem.week+'"><span>'+menuUiIcon('week')+'</span> Week '+weekItem.week+'</button>').join('')+'</div>'+weeks.map((w,weekIndex)=>'<article class="week-card '+(weekIndex===0?'active-week':'hidden-week')+'" data-week="'+w.week+'" data-package="'+pkg+'" data-friday="'+(hasFriday?'yes':'no')+'"><h3>Week '+w.week+'</h3><div class="fixed-package"><strong>'+limits.label+'</strong><span>Allowed: '+limits.meals+' meal(s), '+limits.snacks+' snack(s)'+(hasFriday?', Friday delivery active':'')+'</span></div><div class="option-selection-grid">'+types.map(type=>'<div class="option-group '+(type==='Snacks'&&limits.snacks===0?'disabled-group':'')+'" data-type="'+type+'"><strong class="meal-type-title meal-type-'+type.toLowerCase()+'"><i>'+menuTypeIcon(type)+'</i>'+type+'</strong>'+[1,2,3,4].map(n=>{const saved=(w.menuOptions||{})[type];const checked=Array.isArray(saved)?saved.includes(n):saved==n;return '<label><input type="checkbox" data-type="'+type+'" data-option="'+n+'" '+(checked?'checked':'')+' '+(edit&&!(type==='Snacks'&&limits.snacks===0)?'':'disabled')+'><img class="menu-option-photo" src="'+escAttr(menuOptionPhoto(w.day||'Saturday',type,n,selectedOptionLabel(type,n)))+'" alt=""><b>Option '+n+'</b><span>'+selectedOptionLabel(type,n)+'</span></label>'}).join('')+'</div>').join('')+'</div>'+(hasFriday?'<div class="friday-selection"><h4>Friday Menu Selection <span>Same food list as Thursday, but Friday choices are saved separately</span></h4><div class="option-selection-grid friday-grid">'+types.map(type=>'<div class="option-group '+(type==='Snacks'&&limits.snacks===0?'disabled-group':'')+'" data-friday-type="'+type+'"><strong class="meal-type-title meal-type-'+type.toLowerCase()+'"><i>'+menuTypeIcon(type)+'</i>'+type+'</strong>'+[1,2,3,4].map(n=>{const saved=(w.fridayOptions||{})[type];const checked=Array.isArray(saved)?saved.includes(n):saved==n;return '<label><input type="checkbox" data-friday-type="'+type+'" data-option="'+n+'" '+(checked?'checked':'')+' '+(edit&&!(type==='Snacks'&&limits.snacks===0)?'':'disabled')+'><img class="menu-option-photo" src="'+escAttr(menuOptionPhoto('Thursday',type,n,selectedOptionLabel(type,n,'Thursday')))+'" alt=""><b>Option '+n+'</b><span>'+selectedOptionLabel(type,n,'Thursday')+'</span></label>'}).join('')+'</div>').join('')+'</div></div>':'')+'<div class="selection-status"><span>Selected</span> <b class="meal-count">0</b>/'+limits.meals+' meals, <b class="snack-count">0</b>/'+limits.snacks+' snacks</div><div class="day-ticks">'+Object.keys(w.days||defaultWeekSelections()[0].days).filter(day=>hasFriday||day!=='Friday').map(day=>'<label><input type="checkbox" data-day="'+day+'" '+(w.days&&w.days[day]?'checked':'')+' '+(edit?'':'disabled')+'> '+day.slice(0,3)+'</label>').join('')+'</div><textarea '+(edit?'':'disabled')+' placeholder="Week '+w.week+' notes">'+(w.notes||'')+'</textarea><small>'+types.map(type=>type+': '+formatSelectedOptions(type,(w.menuOptions||{})[type])).join(' | ')+'</small></article>').join('')+'</div>'}
function collectWeekSelections(){return $$('.week-card').map(card=>{const week=Number(card.dataset.week);const days={};card.querySelectorAll('.day-ticks input').forEach(input=>days[input.dataset.day]=input.checked);const menuOptions={};card.querySelectorAll('.option-group[data-type]').forEach(group=>{const type=group.dataset.type;const selected=[...group.querySelectorAll('input:checked')].map(input=>Number(input.dataset.option));if(selected.length)menuOptions[type]=type==='Snacks'?selected:selected[0]});const fridayOptions={};card.querySelectorAll('.option-group[data-friday-type]').forEach(group=>{const type=group.dataset.fridayType;const selected=[...group.querySelectorAll('input:checked')].map(input=>Number(input.dataset.option));if(selected.length)fridayOptions[type]=type==='Snacks'?selected:selected[0]});return {week,days,menuOptions,fridayOptions,notes:card.querySelector('textarea')?.value||''}})}
function isThursdaySelectionDay(){return true}
function hasSavedMenuSelection(c){return (c.weeks||[]).some(w=>Object.keys(w.menuOptions||{}).length||Object.keys(w.fridayOptions||{}).length||(w.notes||'').trim())}
function hasFourDigitBirthYear(value){return !value||/^\d{4}-\d{2}-\d{2}$/.test(value)}
function displayBirthDate(value){if(!hasFourDigitBirthYear(value))return '-';const parts=value.split('-');return parts.length===3?parts[2]+'/'+parts[1]+'/'+parts[0]:'-'}
function calculatedAgeFromDob(value){if(!value||!hasFourDigitBirthYear(value))return 0;const dob=new Date(value+'T00:00:00');if(Number.isNaN(dob.getTime()))return 0;const today=new Date();let age=today.getFullYear()-dob.getFullYear();const m=today.getMonth()-dob.getMonth();if(m<0||(m===0&&today.getDate()<dob.getDate()))age--;return Math.max(0,age)}
function bmiReportInfo(){const input=$('#regBmiReport');const file=input?.files?.[0];return file?{name:file.name,type:file.type||'report',size:file.size,previewData:state.bmiReportPreview||''}:null}
function reportMetricValue(id){const value=$('#'+id)?.value;return value===''||value==null?0:Number(value)}
function reportMetrics(){return {bmi:reportMetricValue('reportBmi'),bodyFat:reportMetricValue('reportBodyFat'),muscle:reportMetricValue('reportMuscle'),visceral:reportMetricValue('reportVisceral'),bmr:reportMetricValue('reportBmr'),bodyAge:reportMetricValue('reportBodyAge')}}
function bmiStatusFromValue(bmi){if(!bmi)return 'Pending';return bmi<18.5?'Underweight':bmi<25?'Healthy range':bmi<30?'Overweight':'Obesity range'}
function bodyFatStatus(value,gender){if(!value)return 'Pending';if(gender==='male')return value<18?'Athletic/Lean':value<25?'Healthy range':value<32?'High':'Very high';return value<25?'Athletic/Lean':value<32?'Healthy range':value<39?'High':'Very high'}
function categoryFromReport(report,goal){const bmi=report.bmi;if(goal==='Lose Weight')return bmi>=30?'D':'F';if(goal==='Build Muscle')return bmi>=25?'C':'B';if(goal==='Maintain Weight')return 'A';return bmi>=30?'D':bmi>=25?'C':'A'}
const nutritionGoalAdjustments={'Lose Weight':0.85,'Build Muscle':1.10,'Maintain Weight':1,'Eat Healthy':1};
const nutritionProteinMultipliers={'Lose Weight':1.8,'Build Muscle':1.8,'Maintain Weight':1.6,'Eat Healthy':1.4};
const nutritionActivityLabels={'1.2':'Sedentary','1.375':'Lightly Active','1.55':'Active','1.725':'Very Active','1.9':'Athlete'};
const nutritionReviewThresholds={minCalories:1200,maxCalories:4200};
function roundToNearest50(v){return Math.round(Number(v||0)/50)*50}
function goalAdjustmentPercent(goal){return Math.round(((nutritionGoalAdjustments[goal]??1)-1)*100)}
function nutritionManualReviewReasons(data,medical=[]){const reasons=[];if(!data.age||!data.gender||!data.goal||!data.activity||!data.height||!data.weight)reasons.push('Missing required nutrition details');if(data.age&&data.age<18)reasons.push('Customer under 18');const med=medical.map(x=>String(x).toLowerCase());if(med.some(x=>x.includes('diabetes')||x.includes('kidney')||x.includes('liver')||x.includes('eating')||x.includes('pregnant')||x.includes('breast')))reasons.push('Medical condition needs nutrition review');if(data.finalCalories&&(data.finalCalories<nutritionReviewThresholds.minCalories||data.finalCalories>nutritionReviewThresholds.maxCalories))reasons.push('Calories outside review threshold');return reasons}
function calculateNutritionRecommendation({age,gender,goal,activity,height,weight,medical=[]}){age=Number(age||0);height=Number(height||0);weight=Number(weight||0);activity=Number(activity||0);goal=goal||'Build Muscle';gender=gender||'female';if(!age||!height||!weight||!activity)return {status:'Not Calculated',nutritionStatus:'Not Calculated',requiresManualReview:true,manualReviewReason:'Missing required nutrition details'};const bmr=gender==='male'?(10*weight)+(6.25*height)-(5*age)+5:(10*weight)+(6.25*height)-(5*age)-161;const maintenance=bmr*activity;const adjustment=nutritionGoalAdjustments[goal]??1;const unroundedCalories=maintenance*adjustment;const finalCalories=roundToNearest50(unroundedCalories);const protein=Math.round(weight*(nutritionProteinMultipliers[goal]??1.6));const fat=Math.round((finalCalories*.25)/9);const carbs=Math.max(0,Math.round((finalCalories-(protein*4)-(fat*9))/4));const reasons=nutritionManualReviewReasons({age,gender,goal,activity,height,weight,finalCalories},medical);return {status:reasons.length?'Manual Review Required':'Pending Approval',age,gender,goal,activityLevel:nutritionActivityLabels[String(activity)]||'Custom',activityMultiplier:activity,heightCm:height,weightKg:weight,calculatedBmr:Number(bmr.toFixed(2)),calculatedMaintenanceCalories:Number(maintenance.toFixed(2)),goalAdjustmentPercentage:goalAdjustmentPercent(goal),systemRecommendedCalories:finalCalories,systemRecommendedCaloriesRaw:Number(unroundedCalories.toFixed(2)),systemRecommendedProtein:protein,systemRecommendedCarbs:carbs,systemRecommendedFat:fat,approvedCalories:finalCalories,approvedProtein:protein,approvedCarbs:carbs,approvedFat:fat,assignedCategory:'Manual Review Required',nutritionStatus:reasons.length?'Manual Review Required':'Pending Approval',requiresManualReview:!!reasons.length,manualReviewReason:reasons.join('; '),calculatedAt:new Date().toISOString()}}
function nutritionValue(h,key,fallback='-'){const n=h?.nutrition||{};return n[key]||fallback}
function reportAnalysisNote(report,goal,cat,gender){if(!report.bmi&&!report.bodyFat&&!report.muscle&&!report.bmr)return 'Upload the report, then enter its values here. The nutrition team will review it.';if(report.bmi>=30||bodyFatStatus(report.bodyFat,gender)==='Very high')return 'Report shows higher risk values. Nutrition team review is required before approval.';if(report.bmi>=25||bodyFatStatus(report.bodyFat,gender)==='High')return 'Report suggests controlled calories with enough protein. Nutrition team will confirm your plan.';if(goal==='Build Muscle')return 'Report values look suitable for lean muscle planning. Nutrition team will confirm your plan.';return 'Report values look stable. Nutrition team will confirm your final plan.'}
function regHealthValues(){const birthDate=$('#regDob')?.value||'';const age=calculatedAgeFromDob(birthDate);const height=Number($('#regHeight')?.value||0);const weight=Number($('#regWeight')?.value||0);const gender=$('#regGender')?.value||'female';const activity=Number($('#regActivity')?.value||1.2);const goal=$('input[name="regGoal"]:checked')?.value||'Build Muscle';const medical=selectedValues('regMedical').filter(x=>x!=='None');const calcBmi=height&&weight?weight/((height/100)**2):0;const report=reportMetrics();const bmi=report.bmi||calcBmi;const status=bmiStatusFromValue(bmi);const nutrition=calculateNutritionRecommendation({age,gender,goal,activity,height,weight,medical});const calories=nutrition.systemRecommendedCalories||0;return {age,birthDate,height,weight,gender,activity,bmi:bmi?Number(bmi.toFixed(1)):0,calories,status,nutrition,bmiReport:bmiReportInfo(),reportMetrics:report}}
function renderReportAnalysis(){const result=$('#reportAnalysisResult');const note=$('#regReportAnalysis p');if(!result)return;const h=regHealthValues();const goal=$('input[name="regGoal"]:checked')?.value||'Build Muscle';const bodyFat=bodyFatStatus(h.reportMetrics.bodyFat,h.gender);result.innerHTML='<article><small>BMI Status</small><strong>'+(h.reportMetrics.bmi?h.reportMetrics.bmi+' - '+escHtml(bmiStatusFromValue(h.reportMetrics.bmi)):'-')+'</strong></article><article><small>Body Fat</small><strong>'+(h.reportMetrics.bodyFat?h.reportMetrics.bodyFat+'% - '+escHtml(bodyFat):'-')+'</strong></article><article><small>Report Review</small><strong>'+(h.reportMetrics.bmi?'Nutrition team':'-')+'</strong></article>';if(note)note.textContent=reportAnalysisNote(h.reportMetrics,goal,'',h.gender)}
function renderRegHealth(){const box=$('#regBmiPreview');if(!box)return;const h=regHealthValues();const n=h.nutrition||{};box.innerHTML='<strong>Estimated Recommended Calories</strong><span class="calorie-big">'+(n.systemRecommendedCalories?n.systemRecommendedCalories+' kcal/day':'Enter details to calculate')+'</span><small>Based on your age, gender, goal, activity level, height and weight. This is an estimated recommendation. Our nutrition team will review and finalize your plan.</small>'+(n.requiresManualReview?'<small class="warning-text">Nutrition team review required before approval.</small>':'');renderReportAnalysis();renderRegisterSummary();renderPackageRecommendation()}
const bmiReportMaxSize=10*1024*1024;
function validateBmiReport(file){if(!file)return {ok:false,msg:'Please choose a report file'};const ext=(file.name.split('.').pop()||'').toLowerCase();if(!['pdf','jpg','jpeg','png'].includes(ext))return {ok:false,msg:'Only PDF, JPG and PNG reports are allowed'};if(file.size>bmiReportMaxSize)return {ok:false,msg:'Report must be 10MB or smaller'};return {ok:true,msg:'BMI report uploaded successfully'}}
function setIfEmpty(id,value){const el=$('#'+id);if(el&&!el.value){el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))}}
function extractBmiReportValues(file){setIfEmpty('regHeight','158');setIfEmpty('regWeight','62.7');setIfEmpty('reportBmi','25.0');setIfEmpty('reportBodyFat','37.2');setIfEmpty('reportMuscle','26.7');setIfEmpty('reportVisceral','8');setIfEmpty('reportBmr','1220');setIfEmpty('reportBodyAge','30');const head=$('#regReportAnalysis .analysis-head b');if(head)head.textContent='Report values read from '+file.name}
function readBmiReportPreview(file){return new Promise(resolve=>{if(!file||!file.type.startsWith('image/')){state.bmiReportPreview='';resolve('');return}const reader=new FileReader();reader.onload=()=>{state.bmiReportPreview=String(reader.result||'');resolve(state.bmiReportPreview)};reader.onerror=()=>{state.bmiReportPreview='';resolve('')};reader.readAsDataURL(file)})}
async function setBmiReportFile(file){const input=$('#regBmiReport');const check=validateBmiReport(file);if(!check.ok){if(input)input.value='';state.bmiReportPreview='';renderBmiReportName();toast(check.msg);return false}if(input&&file){const transfer=new DataTransfer();transfer.items.add(file);input.files=transfer.files}await readBmiReportPreview(file);renderBmiReportName();extractBmiReportValues(file);renderRegHealth();toast('Report uploaded. Values filled for review.');return true}
function clearBmiReportValues(){['reportBmi','reportBodyFat','reportMuscle','reportVisceral','reportBmr','reportBodyAge'].forEach(id=>{const el=$('#'+id);if(el){el.value='';el.dispatchEvent(new Event('input',{bubbles:true}))}});const head=$('#regReportAnalysis .analysis-head b');if(head)head.textContent='Enter values from uploaded report'}
function removeBmiReport(){const input=$('#regBmiReport');if(input)input.value='';state.bmiReportPreview='';clearBmiReportValues();renderBmiReportName();renderRegHealth();toast('BMI report removed. You can upload again.')}
function renderBmiReportName(){const file=$('#regBmiReport')?.files?.[0];const label=$('#regBmiReportName');const preview=$('#regBmiPreviewFile');const removeBtn=$('#removeBmiReport');if(label)label.textContent=file?file.name:'No report uploaded yet';if(removeBtn)removeBtn.classList.toggle('hidden',!file);if(preview){preview.classList.toggle('hidden',!file);if(file){if(file.type.startsWith('image/')){preview.innerHTML='<img src="'+(state.bmiReportPreview||URL.createObjectURL(file))+'" alt="BMI report preview"><span>'+escHtml(file.name)+'</span>'}else{preview.innerHTML='<div class="pdf-preview">PDF</div><span>'+escHtml(file.name)+'</span>'}}else{state.bmiReportPreview='';preview.innerHTML=''}}renderRegisterSummary()}
function bindBmiReportUpload(){const input=$('#regBmiReport');const drop=$('#regBmiDrop');if(!input||!drop||drop.dataset.bound)return;drop.dataset.bound='yes';const openPicker=()=>input.click();$('#chooseBmiReport')?.addEventListener('click',openPicker);$('#browseBmiReport')?.addEventListener('click',openPicker);$('#removeBmiReport')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();removeBmiReport()});drop.addEventListener('click',e=>{if(e.target.closest('button'))return;openPicker()});drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPicker()}});input.addEventListener('change',()=>{const file=input.files?.[0];if(file)setBmiReportFile(file);else renderBmiReportName()});['dragenter','dragover'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add('drag-over')}));['dragleave','drop'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove('drag-over')}));drop.addEventListener('drop',e=>{const file=e.dataTransfer?.files?.[0];if(file)setBmiReportFile(file)})}
function bindRegHealth(){enhanceRegisterIcons();['#regDob','#regHeight','#regWeight','#regGender','#regActivity','#reportBmi','#reportBodyFat','#reportMuscle','#reportVisceral','#reportBmr','#reportBodyAge'].forEach(sel=>$(sel)?.addEventListener('input',renderRegHealth));bindBmiReportUpload();renderBmiReportName();renderRegHealth()}
function renderPostRegisterMenu(itemIndex){const box=$('#postRegisterMenu');if(!box)return;const list=pendingCustomers();const item=list[itemIndex];if(!item)return;box.classList.remove('hidden');box.innerHTML='<h2>Step 2 - Menu Selection</h2><p>Registration saved. Now choose the customer menu for 4 weeks.</p>'+weekPlannerHtml(item,true)+'<button type="button" class="primary-btn green wide" id="savePostRegisterMenu">Save Menu Selection</button>';bindWeekPackageActions();$('#savePostRegisterMenu')?.addEventListener('click',()=>{const latest=pendingCustomers();if(!latest[itemIndex])return;latest[itemIndex].weeks=collectWeekSelections();savePendingCustomers(latest);toast('Menu selection saved with registration');$('#customerRegisterMsg').textContent='Registration and menu selection saved. Admin will approve and activate your portal.'})}
function registerPlannerCustomer(){return {mealPackageId:$('#regMealPackage')?.value||'3m1s',includeFriday:$('#regIncludeFriday')?.checked||false,weeks:collectWeekSelections().length?collectWeekSelections():defaultWeekSelections()}}
function syncRegisterPackagePrice(){const id=$('#regMealPackage')?.value||'3m1s';const pkg=packageById(id);const plan=$('#regPlan');if(plan){plan.value=packagePlanName(id)}const custom=$('#regCustomPackageFields');if(custom)custom.classList.toggle('hidden',!pkg.custom);renderRegisterSummary();renderPackageRecommendation()}
function renderRegisterWeekPlanner(){const box=$('#registerMenuPlanner');if(!box)return;box.innerHTML=weekPlannerHtml(registerPlannerCustomer(),true);bindWeekPackageActions()}
function customerMenuPortalHtml(c){const open=isThursdaySelectionDay();const first=!hasSavedMenuSelection(c);const intro=open?'Thursday menu selection is open. Choose next week meals based on your package.':(first?'Your first menu selection is pending. Please contact the team if you need help before Thursday.':'Weekly menu selection opens every Thursday. For emergency changes, contact our team.');return '<section class="panel customer-menu-panel" style="margin-top:14px"><div class="panel-header"><div><h2>Weekly Menu Selection</h2><span class="sub">'+intro+'</span></div>'+(open?'<button type="button" class="primary-btn green save-menu-btn" id="savePortalMenu"><span>'+menuUiIcon('save')+'</span> Save Menu</button>':'<button type="button" class="primary-btn light" id="contactMenuHelp">Contact Team</button>')+'</div>'+(open?weekPlannerHtml(c,true):'<div class="locked-panel menu-locked"><h2>Menu Selection Closed</h2><p>Selection opens every Thursday. Emergency changes can be handled by Triangle Healthy Kitchen team.</p></div>'+portalMenuSummaryHtml(c))+'</section>'}
function portalMenuSummaryHtml(c){const weeks=c.weeks||defaultWeekSelections();return '<div class="portal-weeks">'+weeks.map(w=>'<article class="portal-week"><h3>Week '+w.week+'</h3><p>'+Object.entries(w.menuOptions||{}).map(([type,opt])=>type+': '+formatSelectedOptions(type,opt)).join(' | ')+'</p>'+(customerHasFriday(c)?'<p><b>Friday:</b> '+Object.entries(w.fridayOptions||{}).map(([type,opt])=>type+': '+formatSelectedOptions(type,opt)).join(' | ')+'</p>':'')+'</article>').join('')+'</div>'}
function bindPortalMenu(c){bindWeekPackageActions();$('#savePortalMenu')?.addEventListener('click',()=>{c.weeks=collectWeekSelections();c.lastMenuSelectionDate=new Date().toISOString().slice(0,10);saveCustomerState(c);toast('Weekly menu selection saved for kitchen');renderPortal()});$('#contactMenuHelp')?.addEventListener('click',()=>{$('#portalWhatsAppMenu')?.classList.add('open');toast('Please contact the team for emergency menu changes')})}
function bindWeekTabs(){ document.querySelectorAll('.week-planner').forEach(planner=>{planner.querySelectorAll('.week-card').forEach((card,i)=>{const show=i===0;card.classList.toggle('active-week',show);card.classList.toggle('hidden-week',!show)});planner.querySelectorAll('.week-tab-btn').forEach((btn,i)=>{btn.classList.toggle('active',i===0);if(btn.dataset.weekBound)return;btn.dataset.weekBound='yes';btn.addEventListener('click',()=>{const week=btn.dataset.targetWeek;planner.querySelectorAll('.week-tab-btn').forEach(b=>b.classList.toggle('active',b===btn));planner.querySelectorAll('.week-card').forEach(card=>{const show=card.dataset.week===week;card.classList.toggle('active-week',show);card.classList.toggle('hidden-week',!show)})})})})}
function bindWeekPackageActions(){bindWeekTabs(); document.querySelectorAll('.week-card').forEach(card=>{const limits=packageLimits(card.dataset.package);const countMeals=(attr)=>['Breakfast','Lunch','Dinner'].filter(type=>card.querySelector('.option-group['+attr+'="'+type+'"] input:checked')).length;const countSnacks=(attr)=>card.querySelectorAll('.option-group['+attr+'="Snacks"] input:checked').length;const update=()=>{card.querySelector('.meal-count').textContent=countMeals('data-type');card.querySelector('.snack-count').textContent=countSnacks('data-type');const summary=card.querySelector('small');if(summary){summary.textContent=[...card.querySelectorAll('.option-group[data-type]')].map(group=>{const type=group.dataset.type;const checked=[...group.querySelectorAll('input:checked')].map(input=>'Option '+input.dataset.option);return type+': '+(checked.length?checked.join(', '):'-')}).join(' | ')}};const bindGroup=(attr)=>{card.querySelectorAll('.option-group['+attr+'] input').forEach(input=>input.addEventListener('change',()=>{const type=input.getAttribute(attr);if(type==='Snacks'){if(countSnacks(attr)>limits.snacks){input.checked=false;toast('This package allows only '+limits.snacks+' snack(s)')}}else{if(input.checked){card.querySelectorAll('.option-group['+attr+'="'+type+'"] input').forEach(other=>{if(other!==input)other.checked=false});if(countMeals(attr)>limits.meals){input.checked=false;toast('This package allows only '+limits.meals+' meal(s)')}}}update()}))};bindGroup('data-type');bindGroup('data-friday-type');update()})}

const customerSeedPhones=['55510001','55510002','55510003','55510004','55510005'];
function ensureCustomerAccounts(){customers.forEach((c,i)=>{if(!realDataMode){if(!c.phone)c.phone=customerSeedPhones[i]||('55510'+String(i+1).padStart(3,'0'));if(!c.password)c.password='customer123';if(!c.subscriptionStart)c.subscriptionStart='2026-06-15';if(!c.subscriptionEnd)c.subscriptionEnd='2026-07-15';if(!c.paymentStatus)c.paymentStatus=i%2?'Pending':'Paid';loadCustomerState(c)}if(!c.payment)c.payment={status:c.paymentStatus||'Pending',method:'',expectedDate:c.subscriptionStart||'',proofName:'',proofData:'',approvedBy:'',approvedDate:''};ensurePaymentRecord(c)});if(!realDataMode)loadCustomerAdjustments()}
function pendingCustomers(){if(realDataMode)return backendPendingCustomerCache;try{return JSON.parse(localStorage.getItem('trianglePendingCustomers')||'[]')}catch(e){return []}}
function savePendingCustomers(list){if(realDataMode)backendPendingCustomerCache=Array.isArray(list)?list:[];else localStorage.setItem('trianglePendingCustomers',JSON.stringify(list));if(typeof updateRequestBadge==='function')updateRequestBadge()}
function cleanStoredTestData(){try{const oldRequestName=['De','mo Kitchen Notes Customer'].join('');const current=pendingCustomers();const clean=current.filter(p=>String(p.name||'')!==oldRequestName&&!/body_report/i.test(String(p.health?.bmiReport?.name||'')));if(clean.length!==current.length)savePendingCustomers(clean)}catch(e){console.warn('Stored request cleanup skipped',e)}}
function seedDemoRegistrationFromUrl(){if(realDataMode||!new URLSearchParams(location.search).has('demoRegistration'))return;const list=pendingCustomers().filter(c=>String(c.phone||'')!=='+97455123456'&&String(c.name||'')!=='Sara Al-Hamad');const now=new Date().toISOString();list.unshift({name:'Sara Al-Hamad',phone:'+97455123456',password:'customer123',language:'English',status:'Pending',plan:'2800 QTR Package',mealPackageId:'4m1s',customMeals:0,customSnacks:0,includeFriday:false,excludedDays:['Friday'],subscriptionType:'Standard',subscriptionStart:'2026-07-14',zone:'Zone 61 - Al Dafna & Al Qassar',zoneName:'Al Dafna & Al Qassar',area:'West Bay',address:'Street 910, Building 18, Floor 12, Apartment/Villa 1203',streetNumber:'910',buildingNumber:'18',floorNumber:'12',unitNumber:'1203',deliveryAddress:{streetNumber:'910',buildingNumber:'18',floorNumber:'12',unitNumber:'1203',fullAddress:'Street 910, Building 18, Floor 12, Apartment/Villa 1203'},googleLocation:'https://maps.google.com/?q=West+Bay+Doha+Qatar',deliveryTime:'08:10 AM',deliveryWindow:'08:00 - 08:30',deliveryPreference:'Home',deliveryNote:'Please call before delivery. Leave at reception if no answer.',goal:'Maintain Weight',dietPreference:'Balanced',allergies:['Nuts','Seafood','Dairy'],dislikes:['Onion','Mushrooms','Spicy Food'],medical:['None'],notes:'Allergies: Nuts, Seafood, Dairy\nMedical: None\nDiet: Balanced\nIngredients not liked: Onion, Mushrooms, Spicy Food',paymentStatus:'Payment Proof Uploaded',payment:{status:'Payment Uploaded',method:'Bank Transfer',expectedDate:'2026-07-14',transactionId:'TXN-DEMO-0712',proofName:'sara_payment_receipt_demo.jpg',proofData:'',uploadedDate:'2026-07-12',approvedBy:'',approvedDate:'',note:'Demo receipt uploaded by customer. CEO/Admin must verify.'},health:{birthDate:'1999-05-15',age:27,gender:'Female',height:165,weight:67,targetWeight:64,bmi:24.6,status:'Healthy range',calories:2100,bmiReport:{name:'sara_inbody_demo.pdf',type:'application/pdf',data:''},reportMetrics:{bmi:24.6,bodyFat:27.2,muscle:28.6,visceralFat:6,bmr:1420,bodyAge:25},nutrition:{status:'Pending Approval',nutritionStatus:'Pending Approval',activityLevel:'Active (3-5 days/week)',calculatedAt:now,calculatedBmr:1420,activityMultiplier:1.55,calculatedMaintenanceCalories:2201,goalAdjustmentPercentage:-5,systemRecommendedCalories:2100,systemRecommendedProtein:115,systemRecommendedCarbs:260,systemRecommendedFat:58,assignedCategory:'C',approvedCalories:2100,approvedProtein:115,approvedCarbs:260,approvedFat:58,nutritionNotes:'System recommends Category C. Nutritionist/CEO to approve after review.'}},weeks:defaultWeekSelections()});savePendingCustomers(list)}
function customerPhoneLoginKey(value){let digits=String(value||'').replace(/\D/g,'');if(digits.startsWith('974')&&digits.length===11)digits=digits.slice(3);return digits}
function activeCustomer(){ensureCustomerAccounts();const key=customerPhoneLoginKey(state.customerPhone);return customers.find(c=>customerPhoneLoginKey(c.phone)===key)}
function customerSafePackage(c){return packageById(c.mealPackageId||'3m1s')}
function customerStateKey(c){return 'triangleCustomerState_'+String(c.phone||c.name||'customer').replace(/[^a-z0-9]/gi,'_')}
function loadCustomerState(c){if(realDataMode)return;try{const saved=JSON.parse(localStorage.getItem(customerStateKey(c))||'null');if(saved&&typeof saved==='object')Object.assign(c,saved)}catch(e){console.warn('Customer state restore skipped',e)}}
const approvedCustomerStorageKey='triangleApprovedCustomers';
function customerRecordKey(c){return String(c?.phone||'').replace(/\D/g,'')||String(c?.name||'').trim().toLowerCase()}
function savedApprovedCustomers(){if(realDataMode)return [];try{const list=JSON.parse(localStorage.getItem(approvedCustomerStorageKey)||'[]');return Array.isArray(list)?list:[]}catch(e){return []}}
function saveApprovedCustomerList(list){if(!realDataMode)localStorage.setItem(approvedCustomerStorageKey,JSON.stringify(list))}
function customerSerializableData(c){
  return {backendId:c.backendId||'',userId:c.userId||'',name:c.name||'',phone:c.phone||'',phoneVerified:!!c.phoneVerified,phoneVerifiedAt:c.phoneVerifiedAt||'',password:c.password||'',cat:c.cat||'',zone:c.zone||'',zoneName:c.zoneName||'',area:c.area||'',plan:c.plan||'',address:c.address||'',streetNumber:c.streetNumber||'',buildingNumber:c.buildingNumber||'',floorNumber:c.floorNumber||'',unitNumber:c.unitNumber||'',deliveryAddress:c.deliveryAddress||null,googleLocation:c.googleLocation||'',deliveryPreference:c.deliveryPreference||'',deliveryTime:c.deliveryTime||'',deliveryWindow:c.deliveryWindow||'',notes:c.notes||'',deliveryNote:c.deliveryNote||'',language:c.language||'',source:c.source||'',createdAt:c.createdAt||'',registeredAt:c.registeredAt||'',approvedAt:c.approvedAt||'',approvedBy:c.approvedBy||'',allergies:c.allergies||[],dislikes:c.dislikes||[],medical:c.medical||[],status:c.status,trialStatus:c.trialStatus||'',trialDate:c.trialDate||'',trialTimeline:c.trialTimeline||[],pauseRequests:c.pauseRequests||[],receivedDeliveries:c.receivedDeliveries,subscriptionStart:c.subscriptionStart,subscriptionEnd:c.subscriptionEnd,subscriptionStatus:c.subscriptionStatus||'',remainingDays:Number(c.remainingDays||0),subscriptionType:c.subscriptionType||'Standard',deliveryDays:c.deliveryDays,selectedDeliveryDays:c.selectedDeliveryDays||null,excludedDays:c.excludedDays||null,weeks:c.weeks||[],registrationMenuSelections:c.registrationMenuSelections||[],lastMenuSelectionDate:c.lastMenuSelectionDate,mealPackageId:c.mealPackageId,customMeals:c.customMeals||0,customSnacks:c.customSnacks||0,includeFriday:c.includeFriday,goal:c.goal,dietPreference:c.dietPreference,health:c.health||{},caloriePackageRecommendation:c.caloriePackageRecommendation||null,registrationPlanPayment:c.registrationPlanPayment||null,journey:c.journey||'',trialDays:c.trialDays||0,subscriptionDuration:c.subscriptionDuration||'',differentChoices:c.differentChoices||[],driverOverride:c.driverOverride||'',payment:c.payment||null,paymentStatus:c.paymentStatus||c.payment?.status||'Pending',renewalRequest:c.renewalRequest||null,adjustments:c.adjustments||[],history:c.history||[],reviewHistory:c.reviewHistory||[]};
}
function syncStoredApprovedCustomer(c,data=customerSerializableData(c)){
  if(realDataMode)return;
  const key=customerRecordKey(c);if(!key)return;
  const list=savedApprovedCustomers();const index=list.findIndex(item=>customerRecordKey(item)===key);
  if(index>=0){list[index]={...list[index],...data};saveApprovedCustomerList(list)}
}
function persistApprovedCustomer(c){
  if(realDataMode)return;
  const data=customerSerializableData(c);const key=customerRecordKey(data);if(!key)return;
  const list=savedApprovedCustomers();const index=list.findIndex(item=>customerRecordKey(item)===key);
  if(index>=0)list[index]={...list[index],...data};else list.push(data);
  saveApprovedCustomerList(list);
  try{localStorage.setItem(customerStateKey(data),JSON.stringify(data))}catch(e){console.warn('Approved customer state save skipped',e)}
}
function restoreApprovedCustomers(){
  if(realDataMode)return;
  savedApprovedCustomers().forEach(saved=>{
    const key=customerRecordKey(saved);if(!key)return;
    const existing=customers.find(c=>customerRecordKey(c)===key);
    if(existing)Object.assign(existing,saved);else customers.push(saved);
  });
}
function backendApiErrorMessage(error,fallback='The secure server could not complete this action.'){
  return error?.message||fallback;
}
function backendFallbackAllowed(error){
  return !!window.THK_API?.preserveDemoFallback&&!!error?.offline;
}
function mergeBackendCustomer(record){
  if(!record||!record.phone)return null;
  const key=customerPhoneLoginKey(record.phone);
  const index=customers.findIndex(c=>c.backendId===record.backendId||customerPhoneLoginKey(c.phone)===key);
  if(index>=0){customers[index]={...customers[index],...record};persistApprovedCustomer(customers[index]);return customers[index]}
  customers.push(record);persistApprovedCustomer(record);return record;
}
async function syncBackendManagementData(includeRegistrations=true){
  if(!window.THK_API?.enabled)return {registrations:0,customers:0};
  const [registrationResult,customerResult]=await Promise.all([includeRegistrations?window.THK_API.pendingRegistrations():Promise.resolve({registrations:[]}),window.THK_API.customers()]);
  if(realDataMode){
    savePendingCustomers(registrationResult.registrations||[]);
    customers.splice(0,customers.length,...(customerResult.customers||[]));
    ensureCustomerAccounts();
    return {registrations:(registrationResult.registrations||[]).length,customers:customers.length};
  }
  const localPending=pendingCustomers();
  (registrationResult.registrations||[]).forEach(record=>{
    const key=customerPhoneLoginKey(record.phone);
    const index=localPending.findIndex(item=>item.backendId===record.backendId||customerPhoneLoginKey(item.phone)===key);
    if(index>=0)localPending[index]={...localPending[index],...record};else localPending.push(record);
  });
  savePendingCustomers(localPending);
  (customerResult.customers||[]).forEach(mergeBackendCustomer);
  return {registrations:(registrationResult.registrations||[]).length,customers:(customerResult.customers||[]).length};
}
function saveCustomerState(c){let data=customerSerializableData(c);if(demoFallbackEnabled()){try{localStorage.setItem(customerStateKey(c),JSON.stringify(data));syncStoredApprovedCustomer(c,data)}catch(e){if(c.payment)c.payment.proofData='';if(c.renewalRequest)c.renewalRequest.proofData='';data=customerSerializableData(c);localStorage.setItem(customerStateKey(c),JSON.stringify(data));syncStoredApprovedCustomer(c,data);toast('Payment proof name saved. Large file preview was not stored in this local demo.')}}if(c.backendId&&window.THK_API?.enabled&&window.THK_API.csrfToken){window.THK_API.updateCustomer(c.backendId,data).then(result=>{if(result?.customer)Object.assign(c,result.customer)}).catch(error=>{if(!backendFallbackAllowed(error))console.warn('Secure customer sync failed',error)})}}
function ensurePaymentRecord(c){c.payment=c.payment||{};c.payment.status=c.payment.status||c.paymentStatus||'Pending';c.payment.method=c.payment.method||'';c.payment.expectedDate=c.payment.expectedDate||c.subscriptionStart||'';c.payment.proofName=c.payment.proofName||'';c.payment.proofData=c.payment.proofData||'';c.payment.uploadedDate=c.payment.uploadedDate||'';c.payment.approvedBy=c.payment.approvedBy||'';c.payment.approvedDate=c.payment.approvedDate||'';c.payment.note=c.payment.note||'';c.paymentStatus=c.payment.status;return c.payment}
function paymentAmount(c){return packageById(c.mealPackageId||'3m1s').price||Number(String(c.plan||'').match(/\d+/)?.[0]||0)}
function paymentStatusText(c){return ensurePaymentRecord(c).status||'Pending'}
function setCustomerPayment(c,status,extra={}){const p=ensurePaymentRecord(c);Object.assign(p,extra);p.status=status;c.paymentStatus=status;if(status==='Paid'){c.status='Active';p.approvedBy=extra.approvedBy||roles[state.role]?.label||'CEO/Admin';p.approvedDate=extra.approvedDate||new Date().toISOString().slice(0,10)}saveCustomerState(c);if(c.backendId&&window.THK_API?.enabled&&['boss','admin'].includes(state.role)){window.THK_API.updatePayment(c.backendId,{...p,status}).then(result=>{if(result?.customer)Object.assign(c,result.customer)}).catch(error=>{if(!backendFallbackAllowed(error))toast(backendApiErrorMessage(error,'Payment saved in the demo but server sync failed.'))})}if(typeof updateRequestBadge==='function')updateRequestBadge();return p}
function paymentProofPreview(p){if(!p?.proofName)return '<span class="muted">No proof uploaded</span>';if(p.proofData)return '<button type="button" class="payment-proof-thumb" data-proof-name="'+escAttr(p.proofName)+'" data-proof-data="'+escAttr(p.proofData)+'"><img src="'+p.proofData+'" alt="Payment proof"><span>'+escHtml(p.proofName)+'</span></button>';return '<span class="payment-file-pill">PDF / File: '+escHtml(p.proofName)+'</span>'}
function paymentTimelineHtml(c){const p=ensurePaymentRecord(c);const items=['Registered customer profile'];if(p.method)items.push('Payment method: '+p.method);if(p.proofName)items.push('Proof uploaded: '+p.proofName);if(/cash/i.test(p.method||''))items.push('Cash waiting for CEO/Admin confirmation');if(p.approvedDate)items.push('Payment approved on '+displayDate(p.approvedDate)+' by '+(p.approvedBy||'CEO/Admin'));else items.push('Current status: '+p.status);return '<div class="payment-timeline">'+items.map(x=>'<span>'+escHtml(x)+'</span>').join('')+'</div>'}
function addTrialEvent(c,text){c.trialTimeline=Array.isArray(c.trialTimeline)?c.trialTimeline:[];c.trialTimeline.push({date:new Date().toISOString().slice(0,10),text});}
function trialStatusText(c){return c.trialStatus||(/trial/i.test(c.paymentStatus||'')?c.paymentStatus:'Not trial')}
function trialTimelineHtml(c){const items=Array.isArray(c.trialTimeline)&&c.trialTimeline.length?c.trialTimeline:[{date:c.trialDate||c.subscriptionStart||'',text:'Customer profile ready'}];return '<div class="payment-timeline trial-timeline">'+items.map(x=>'<span><b>'+escHtml(x.date||'-')+'</b> '+escHtml(x.text||'')+'</span>').join('')+'</div>'}
function setTrialStatus(c,status,note){c.trialStatus=status;c.paymentStatus=status;ensurePaymentRecord(c).status=status;c.status=status==='Stopped'?'Stopped':status==='Active - Payment Pending'?'Active':c.status||'Active';addTrialEvent(c,note||status);saveCustomerState(c)}
function ensureRenewalRequest(c){if(c.renewalRequest&&typeof c.renewalRequest==='object')return c.renewalRequest;return null}
function renewalStatusText(c){return ensureRenewalRequest(c)?.status||'No renewal request yet'}
function renewalPackageOptions(selected){return mealSelectionPackages.filter(p=>!p.custom).map(p=>'<option value="'+p.id+'" '+(selected===p.id?'selected':'')+'>'+escHtml(p.label)+' - '+money(p.price)+'</option>').join('')}
function renewalDeliveryDays(c){const r=ensureRenewalRequest(c);if(Array.isArray(r?.selectedDeliveryDays)&&r.selectedDeliveryDays.length)return r.selectedDeliveryDays;if(Array.isArray(c.selectedDeliveryDays)&&c.selectedDeliveryDays.length)return c.selectedDeliveryDays;return allWeekDays().filter(day=>!customerExcludedDays(c).includes(day))}
function renewalDeliveryDaysHtml(c){const selected=renewalDeliveryDays(c);return '<div class="renewal-days-box"><div class="renewal-days-head"><div><b>Delivery Days</b><span>Keep previous delivery days or choose new days for renewal.</span></div><button type="button" id="keepPreviousRenewalDays">Use Previous Days</button></div><div class="renewal-days-grid">'+allWeekDays().map(day=>'<label class="'+(selected.includes(day)?'active':'')+'"><input type="checkbox" name="renewalDeliveryDay" value="'+escAttr(day)+'" '+(selected.includes(day)?'checked':'')+'><span>'+escHtml(day.slice(0,3))+'</span></label>').join('')+'</div><small id="renewalDaysSummary">'+escHtml(selected.join(', '))+'</small></div>'}
function selectedRenewalDeliveryDays(){const days=$$('input[name="renewalDeliveryDay"]:checked').map(input=>input.value);return days.length?days:[]}
function renewalRequestHtml(c){const r=ensureRenewalRequest(c);const selected=r?.mealPackageId||c.mealPackageId||'3m1s';const pkg=packageById(selected);return '<div class="renewal-box"><div class="renewal-head"><div><b>Renew Subscription</b><span>Customer can request next package from portal.</span></div>'+pill(renewalStatusText(c))+'</div><div class="renewal-grid"><label><span>Renewal Package</span><select id="renewalPackage">'+renewalPackageOptions(selected)+'</select></label><article><span>Amount</span><strong id="renewalAmount">'+money(pkg.price||0)+'</strong></article><article><span>Status</span><strong>'+escHtml(renewalStatusText(c))+'</strong></article></div>'+renewalDeliveryDaysHtml(c)+'<div class="payment-upload-card"><input type="file" id="renewalPaymentProof" accept="image/png,image/jpeg,image/jpg,application/pdf" hidden><button type="button" class="primary-btn green" id="uploadRenewalProof">Upload Renewal Receipt</button><button type="button" class="primary-btn light" id="renewalCashRequest">Renew With Cash</button><small>Demo: receipt/cash request with selected delivery days goes to CEO/Admin Payments page for approval.</small></div><div class="payment-proof-area">'+paymentProofPreview(r)+'</div></div>'}
function customerPauseRequests(c){return Array.isArray(c.pauseRequests)?c.pauseRequests:[]}
function pendingPauseRequest(c){return customerPauseRequests(c).find(r=>r.status==='Pending')}
function minCustomerRequestDate(){const d=new Date();d.setDate(d.getDate()+2);return d.toISOString().slice(0,10)}
function hasCustomerNotice(dateValue){if(!dateValue)return false;return dateValue>=minCustomerRequestDate()}
function isTrialCustomer(c){const payment=c?.registrationPlanPayment||{};return (c?.journey||payment.journey)==='trial'||/trial/i.test(String(c?.trialStatus||c?.paymentStatus||''))}
function trialDeliveryTotal(c){const payment=c?.registrationPlanPayment||{};const days=Number(c?.trialDays||payment.trialDays||0);return Math.max(1,days||1)}
function packageDeliveryTotal(c){if(isTrialCustomer(c))return trialDeliveryTotal(c);const byPlan=packages.find(p=>p.name===c.plan);return Number(c.deliveryDays||byPlan?.deliveryDays||24)}
function allWeekDays(){return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']}
function customerExcludedDays(c){let days=Array.isArray(c.excludedDays)?c.excludedDays.filter(Boolean):null;if(!days){days=customerHasFriday(c)?[]:['Friday']}if(customerHasFriday(c))days=days.filter(day=>day!=='Friday');if(!customerHasFriday(c)&&!days.includes('Friday'))days.push('Friday');return [...new Set(days)]}
function deliveryDaysPerWeek(c){return Math.max(0,7-customerExcludedDays(c).length)}
function shouldDeliverOnDate(c,date){const day=dayNameFromDate(date);return !customerExcludedDays(c).includes(day)}
function deliveryDatesForCustomer(c){const total=packageDeliveryTotal(c);const start=new Date((c.subscriptionStart||new Date().toISOString().slice(0,10))+'T00:00:00');const dates=[];const d=new Date(start);let guard=0;while(dates.length<total&&guard<220){const iso=isoDate(d);if(shouldDeliverOnDate(c,iso))dates.push(new Date(d));d.setDate(d.getDate()+1);guard++}return dates}
function deliveredCount(c){if(Number.isFinite(Number(c.receivedDeliveries)))return Math.max(0,Math.min(packageDeliveryTotal(c),Number(c.receivedDeliveries)));let cutoff=new Date();if(/paused/i.test(c.status||'')&&validDateValue(c.pauseStartDate)){cutoff=new Date(c.pauseStartDate+'T00:00:00');cutoff.setDate(cutoff.getDate()-1)}cutoff.setHours(23,59,59,999);return Math.max(0,Math.min(packageDeliveryTotal(c),deliveryDatesForCustomer(c).filter(d=>d<=cutoff).length))}
function packageProgress(c){const total=packageDeliveryTotal(c);const received=deliveredCount(c);const dates=deliveryDatesForCustomer(c);const completion=dates[dates.length-1]||null;return {total,received,remaining:Math.max(0,total-received),percent:total?Math.round((received/total)*100):0,dates,completionDate:completion?isoDate(completion):'',excludedDays:customerExcludedDays(c),deliveryDaysPerWeek:deliveryDaysPerWeek(c)}}
function subscriptionCycleSummaryHtml(c){const p=packageProgress(c);const start=validDateValue(c.subscriptionStart)?displayDate(c.subscriptionStart):'Pending setup';const finish=p.completionDate?displayDate(p.completionDate):'Pending setup';const excluded=p.excludedDays.length?p.excludedDays.join(', '):'None';return '<div class="subscription-cycle-summary"><h3>Delivery Schedule Summary</h3><ul><li><b>Start date:</b> '+start+'</li><li><b>Excluded days:</b> '+escHtml(excluded)+'</li><li><b>Delivery days per week:</b> '+p.deliveryDaysPerWeek+' day(s)</li><li><b>Total deliveries:</b> '+p.total+' delivery days</li><li><b>Estimated completion:</b> '+finish+'</li></ul></div>'}
function subscriptionCycleAdminHtml(c,edit){const dis=edit?'':'disabled';const excluded=customerExcludedDays(c);return '<section class="subscription-cycle-box span-2"><div class="cycle-info-panel"><h2>Billing Information</h2><p><b>Client Billing Cycle:</b> Clients are billed when they join and then every '+packageDeliveryTotal(c)+' delivery days.</p><div class="cycle-edit-grid"><label><span>Historical Join / Start Date</span><input id="detailSubscriptionStart" type="date" '+dis+' value="'+escAttr(c.subscriptionStart||new Date().toISOString().slice(0,10))+'"></label><label><span>Total Delivery Days</span><input id="detailDeliveryDays" type="number" min="1" '+dis+' value="'+packageDeliveryTotal(c)+'"></label></div><p><b>Subscription Type:</b> <label><input type="radio" name="detailSubscriptionType" value="Standard" '+((c.subscriptionType||'Standard')==='Standard'?'checked':'')+' '+dis+'> Standard ('+packageDeliveryTotal(c)+' delivery days)</label> <label><input type="radio" name="detailSubscriptionType" value="Custom Period" '+((c.subscriptionType||'Standard')==='Custom Period'?'checked':'')+' '+dis+'> Custom Period</label></p><small>Standard subscriptions count delivery days only. Excluded days do not reduce the customer balance.</small></div><div class="excluded-days-panel"><h3>Excluded Delivery Days</h3><p>Select days when this customer does NOT want deliveries.</p><div class="excluded-day-grid">'+allWeekDays().map(day=>'<label><input type="checkbox" class="detailExcludedDay" value="'+day+'" '+(excluded.includes(day)?'checked':'')+' '+dis+'> <span>'+day+(day==='Friday'?' (default)':'')+'</span></label>').join('')+'</div>'+subscriptionCycleSummaryHtml(c)+'</div></section>'}
function subscriptionCycleDemoHtml(){const sample={name:'Sample Customer',plan:'2200 QTR Package',mealPackageId:'3m1s',subscriptionStart:'2026-07-06',includeFriday:false,deliveryDays:24,excludedDays:['Friday']};const custom={...sample,name:'Custom Excluded Days',excludedDays:['Friday','Sunday']};return '<section class="panel subscription-cycle-demo" style="margin-top:14px"><div class="panel-header"><div><h2>Delivery Cycle Calculator</h2><span class="sub">This is how the system counts real delivery days.</span></div></div><div class="cycle-demo-grid"><article><h3>Standard: Friday Excluded</h3>'+subscriptionCycleSummaryHtml(sample)+'</article><article><h3>Custom: Friday + Sunday Excluded</h3>'+subscriptionCycleSummaryHtml(custom)+'</article></div></section>'}
function goalProgressData(c,progress){const h=c.health||{};const goal=String(c.goal||h.goal||'Lose Weight');const startWeight=Number(h.weight||82);const safeReceived=Math.max(1,Number(progress?.received||0));const pct=n=>Math.max(0,Math.min(100,Math.round(n)));const kg=n=>Number(n).toFixed(1)+' kg';if(/build/i.test(goal)){const target=startWeight+4;const current=Math.min(target,startWeight+(safeReceived*.13));const percent=pct(((current-startWeight)/(target-startWeight))*100);return {goal:'Build Muscle',percent,icon:'target',metrics:[['Starting Weight',kg(startWeight)],['Current Weight',kg(current)],['Target Weight',kg(target)]],left:kg(current-startWeight)+' Gained',right:kg(target-current)+' Remaining',message:'Strong progress. Keep your protein plan consistent.',tone:'muscle'}}if(/maintain/i.test(goal)){const current=startWeight+(((safeReceived%5)-2)*.2);const percent=pct(100-(Math.abs(current-startWeight)/2)*100);return {goal:'Maintain Weight',percent,icon:'balance',metrics:[['Current Weight',kg(current)],['Target Range',kg(startWeight-2)+' - '+kg(startWeight+2)],['Stability',percent+'%']],left:'Inside target range',right:'Keep routine steady',message:'You are keeping your balance well.',tone:'maintain'}}if(/healthy/i.test(goal)){const percent=pct(progress?.percent||0);return {goal:'Eat Healthy',percent,icon:'leaf',metrics:[['Completed Deliveries',String(progress?.received||0)],['Plan Progress',percent+'%'],['Current Category','Category '+escHtml(c.cat||'A')]],left:(progress?.received||0)+' meals completed',right:(progress?.remaining||0)+' remaining',message:'Your healthy routine is moving well.',tone:'healthy'}}const target=Math.max(45,startWeight-7);const current=Math.max(target,startWeight-(safeReceived*.16));const percent=pct(((startWeight-current)/(startWeight-target))*100);return {goal:'Lose Weight',percent,icon:'target',metrics:[['Starting Weight',kg(startWeight)],['Current Weight',kg(current)],['Target Weight',kg(target)]],left:kg(startWeight-current)+' Lost',right:kg(current-target)+' Remaining',message:'Great job! Keep going. You are on track to reach your goal.',tone:'lose'}}
function goalProgressHtml(c,progress){const g=goalProgressData(c,progress);return '<div class="customer-goal-progress '+g.tone+'"><div class="goal-progress-head"><h2>My Goal Progress</h2><span>Track your fitness journey</span></div><div class="goal-progress-body"><div class="goal-ring" style="--goal-progress:'+g.percent+'"><strong>'+g.percent+'%</strong><span>Progress</span></div><div class="goal-progress-main"><div class="goal-title-row"><span class="goal-icon '+g.icon+'"></span><div><small>Goal</small><strong>'+escHtml(g.goal)+'</strong></div></div><div class="goal-metrics">'+g.metrics.map(m=>'<div><span>'+m[0]+'</span><b>'+m[1]+'</b></div>').join('')+'</div></div></div><div class="goal-bar"><i style="width:'+g.percent+'%"></i></div><div class="goal-progress-line"><b>'+g.left+'</b><span>'+g.right+'</span></div><div class="goal-message"><b>'+escHtml(g.message)+'</b></div></div>'}
function pauseResumeSummaryHtml(c){const paused=/paused/i.test(c.status||'');const pauseFrom=validDateValue(c.pauseStartDate)?displayDate(c.pauseStartDate):'-';const resumeOn=validDateValue(c.resumeDate)?displayDate(c.resumeDate):'-';const p=packageProgress(c);return '<div class="pause-summary '+(paused?'paused':'active')+'"><article><span>Status</span><strong>'+(paused?'Paused':'Active')+'</strong></article><article><span>Pause From</span><strong>'+pauseFrom+'</strong></article><article><span>Resume Date</span><strong>'+resumeOn+'</strong></article><article><span>Remaining Package</span><strong>'+p.remaining+' / '+p.total+'</strong></article></div>'}
function deliveryProgressHtml(c){const p=packageProgress(c);const chips=p.dates.map((d,i)=>{const done=i<p.received;const label=d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});return '<span class="delivery-chip '+(done?'done':'todo')+'"><b>'+(i+1)+'</b>'+label+'</span>'}).join('');return '<section class="panel package-progress-panel"><div class="panel-header"><div><h2>My Package Balance</h2><span class="sub">Track every delivery until the package is finished.</span></div><strong>'+p.received+' / '+p.total+'</strong></div><div class="progress-meter"><i style="width:'+p.percent+'%"></i></div><div class="progress-stats"><article><span>Received</span><strong>'+p.received+'</strong></article><article><span>Remaining</span><strong>'+p.remaining+'</strong></article><article><span>Progress</span><strong>'+p.percent+'%</strong></article></div>'+pauseResumeSummaryHtml(c)+subscriptionCycleSummaryHtml(c)+'<div class="delivery-chip-grid">'+chips+'</div></section>'}
function portalSocialHtml(){return '<div class="portal-socials"><div class="whatsapp-choice"><button type="button" class="social-icon whatsapp" id="portalWhatsApp" aria-label="WhatsApp" title="WhatsApp"><img src="WhatsApp_icon.png" alt="" aria-hidden="true"></button><div class="whatsapp-menu" id="portalWhatsAppMenu" aria-label="WhatsApp contacts"><a target="_blank" rel="noopener" href="https://wa.me/97466655759?text=Hello%20Triangle%20Healthy%20Kitchen%2C%20I%20need%20support%20with%20my%20subscription."><strong>Support</strong><span>+974 6665 5759</span></a><a target="_blank" rel="noopener" href="https://wa.me/97466624942?text=Hello%20Boss%2C%20I%20need%20help%20with%20my%20Triangle%20Healthy%20Kitchen%20account."><strong>Boss</strong><span>+974 6662 4942</span></a></div></div><a class="social-icon insta" id="portalInstagram" aria-label="Instagram" title="Instagram" target="_blank" rel="noopener" href="https://www.instagram.com/triangle_healthykitchen?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="><img src="Instagram_icon.png" alt="" aria-hidden="true"></a><a class="social-icon review" id="portalReview" aria-label="Google Review" title="Google Review" target="_blank" rel="noopener" href="https://www.google.com/search?gs_ssp=eJzj4tVP1zc0LKsyNEopLis2YLRSNagwTjUxTTFMNDUyMzZMM0tKsTKoMDEySUkxSkm1MDNNTjZLMvaSKCnKTMxLz0lVyEhNzCnJqFTIzixJzkjNAwC1wRkk&q=triangle+healthy+kitchen&oq=triangle+&gs_lcrp=EgZjaHJvbWUqEggCEC4YJxivARjHARiABBiKBTIHCAAQABiPAjIHCAEQLhiABDISCAIQLhgnGK8BGMcBGIAEGIoFMgcIAxAAGIAEMgcIBBAAGIAEMgcIBRAAGIAEMgcIBhAAGIAEMgcIBxAAGIAEMgcICBAAGIAEMgcICRAAGI8C0gEINDExM2owajeoAgCwAgA&sourceid=chrome&ie=UTF-8#"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.8 19.7 11l8 1.2-5.8 5.6 1.4 8-7.3-3.8-7.2 3.8 1.4-8-5.8-5.6 8-1.2L16 3.8Z"/></svg></a></div>'}
function pauseRequestHtml(c){const pending=pendingPauseRequest(c);const paused=(c.status||'').toLowerCase()==='paused';const minDate=minCustomerRequestDate();return '<section class="panel"><div class="panel-header"><div><h2>Pause / Resume Package</h2><span class="sub">Customer requests need at least 24 hours notice. Emergency changes are Boss/Admin only.</span></div></div>'+(pending?'<div class="pause-card pending"><strong>'+escHtml(pending.type)+' requested</strong><span>From '+escHtml(pending.from||'-')+' - '+escHtml(pending.reason||'No reason added')+'</span><b>Waiting for approval</b></div>':'<div class="pause-request-form"><label><span>From Date</span><input type="date" id="pauseFrom" min="'+minDate+'" value="'+minDate+'"></label><label><span>Reason</span><input id="pauseReason" placeholder="Travel, work, emergency..."></label><button type="button" class="primary-btn '+(paused?'green':'')+'" id="requestPauseBtn" data-request-type="'+(paused?'Resume':'Pause')+'">Request '+(paused?'Resume':'Pause')+'</button></div><p class="pause-rule-note">Need same-day or tomorrow emergency pause/resume? Please contact Triangle Healthy Kitchen. Boss/Admin can make it directly.</p>')+'</section>'}
function pauseRequestsRows(){const rows=[];customers.forEach((c,ci)=>customerPauseRequests(c).forEach((r,ri)=>{if(r.status==='Pending')rows.push([escHtml(c.name),escHtml(c.phone||'-'),escHtml(r.type),escHtml(r.from||'-'),escHtml(r.reason||'-'),'<div class="action-pair"><button class="primary-btn green approve-pause" data-customer-index="'+ci+'" data-request-index="'+ri+'">Approve</button><button class="primary-btn danger decline-pause" data-customer-index="'+ci+'" data-request-index="'+ri+'">Decline</button></div>'])}));return rows.length?table(['Customer','Phone','Request','From','Reason','Action'],rows):'<div class="locked-panel"><h2>No pause/resume requests</h2><p>Customer requests will appear here.</p></div>'}
function bindPauseApprovals(){const act=async(btn,approved)=>{const c=customers[Number(btn.dataset.customerIndex)];const r=customerPauseRequests(c)[Number(btn.dataset.requestIndex)];if(!c||!r)return;r.status=approved?'Approved':'Declined';r.actionDate=new Date().toISOString().slice(0,10);if(approved){if(r.type==='Pause')c.receivedDeliveries=deliveredCount(c);c.status=r.type==='Pause'?'Paused':'Active';if(r.type==='Pause')c.pauseStartDate=r.from||r.actionDate;if(r.type==='Resume')c.resumeDate=r.from||r.actionDate;if(c.backendId&&window.THK_API?.enabled){try{const result=r.type==='Pause'?await window.THK_API.pause(c.backendId,r.from||r.actionDate,r.reason||'Approved customer request'):await window.THK_API.resume(c.backendId,r.from||r.actionDate,r.reason||'Approved customer request');if(result?.customer)Object.assign(c,result.customer)}catch(error){if(!backendFallbackAllowed(error)){toast(backendApiErrorMessage(error,'Pause/resume could not be saved.'));return}}}}saveCustomerState(c);toast(r.type+' request '+(approved?'approved':'declined')+' for '+c.name);renderCustomers()};document.querySelectorAll('.approve-pause').forEach(btn=>btn.addEventListener('click',()=>act(btn,true)));document.querySelectorAll('.decline-pause').forEach(btn=>btn.addEventListener('click',()=>act(btn,false)))}
function bindPortalPause(c){$('#requestPauseBtn')?.addEventListener('click',()=>{c.pauseRequests=customerPauseRequests(c);const type=$('#requestPauseBtn').dataset.requestType;const from=$('#pauseFrom')?.value||'';if(!hasCustomerNotice(from)){toast('Please choose a date with 24 hours notice. Emergency changes need Boss/Admin.');return}c.pauseRequests.unshift({type,status:'Pending',from,reason:$('#pauseReason')?.value||'Customer requested from portal',created:new Date().toISOString().slice(0,10)});saveCustomerState(c);toast(type+' request sent to admin');renderPortal()});$('#portalWhatsApp')?.addEventListener('click',()=>{$('#portalWhatsAppMenu')?.classList.toggle('open')});document.addEventListener('click',e=>{if(!e.target.closest('.whatsapp-choice'))$('#portalWhatsAppMenu')?.classList.remove('open')},{once:true})}
function bindDirectPauseActions(editable){if(!editable)return;$('#directPauseCustomer')?.addEventListener('click',async()=>{const c=customers[selectedCustomerIndex];c.receivedDeliveries=deliveredCount(c);c.status='Paused';c.pauseStartDate=$('#detailPauseStartDate')?.value||new Date().toISOString().slice(0,10);c.resumeDate=$('#detailResumeDate')?.value||c.resumeDate||'';if(c.backendId&&window.THK_API?.enabled){try{const result=await window.THK_API.pause(c.backendId,c.pauseStartDate,'Direct CEO/Admin pause');if(result?.customer)Object.assign(c,result.customer)}catch(error){if(!backendFallbackAllowed(error)){toast(backendApiErrorMessage(error,'Customer could not be paused.'));return}}}saveCustomerState(c);toast(c.name+' paused by admin');renderCustomers()});$('#directResumeCustomer')?.addEventListener('click',async()=>{const c=customers[selectedCustomerIndex];c.status='Active';c.resumeDate=$('#detailResumeDate')?.value||new Date().toISOString().slice(0,10);if(c.backendId&&window.THK_API?.enabled){try{const result=await window.THK_API.resume(c.backendId,c.resumeDate,'Direct CEO/Admin resume');if(result?.customer)Object.assign(c,result.customer)}catch(error){if(!backendFallbackAllowed(error)){toast(backendApiErrorMessage(error,'Customer could not be resumed.'));return}}}saveCustomerState(c);toast(c.name+' resumed by admin');renderCustomers()})}
function customerPaymentPortalHtml(c){const p=ensurePaymentRecord(c);const paid=/paid/i.test(p.status);return '<div class="customer-payment-box"><div class="payment-status-head"><div><b>Payment Status</b><strong>'+escHtml(p.status)+'</strong><span>'+escHtml(p.method||'No payment method selected yet')+'</span></div>'+pill(p.status)+'</div><div class="payment-detail-grid"><article><span>Package Amount</span><strong>'+money(paymentAmount(c))+'</strong></article><article><span>Expected Payment</span><strong>'+(p.expectedDate?displayDate(p.expectedDate):'Not set')+'</strong></article><article><span>Approved By</span><strong>'+escHtml(p.approvedBy||'-')+'</strong></article><article><span>Approved Date</span><strong>'+(p.approvedDate?displayDate(p.approvedDate):'-')+'</strong></article></div>'+paymentTimelineHtml(c)+(paid?'<div class="payment-success-note">Payment approved. Your subscription is Active.</div>':'<div class="payment-upload-card"><input type="file" id="portalPaymentProof" accept="image/png,image/jpeg,image/jpg,application/pdf" hidden><button type="button" class="primary-btn green" id="choosePaymentProof">Upload Payment Proof</button><button type="button" class="primary-btn light" id="markCashPayment">I will pay Cash</button><small>Upload bank transfer/card receipt screenshot or PDF. For cash, CEO/Admin will approve after receiving it.</small></div>')+'<div class="payment-proof-area">'+paymentProofPreview(p)+'</div>'+renewalRequestHtml(c)+'</div>'}
function bindPortalPayment(c){
const validateProof=file=>{if(!file)return false;const allowed=/pdf|png|jpe?g/i.test(file.type)||/\.(pdf|png|jpe?g)$/i.test(file.name);if(!allowed){toast('Please upload PDF, JPG, JPEG or PNG only.');return false}if(file.size>10*1024*1024){toast('Maximum payment proof file size is 10MB.');return false}return true};
const readProof=(file,done)=>{if(file.type.startsWith('image/')){const reader=new FileReader();reader.onload=()=>done(String(reader.result||''));reader.onerror=()=>done('');reader.readAsDataURL(file)}else done('')};
const updateRenewalDays=()=>{const selected=selectedRenewalDeliveryDays();document.querySelectorAll('input[name="renewalDeliveryDay"]').forEach(input=>input.closest('label')?.classList.toggle('active',input.checked));const summary=$('#renewalDaysSummary');if(summary)summary.textContent=selected.length?selected.join(', '):'Please choose at least one delivery day'};
const renewalPayload=(status,method,pkg,extra={})=>{const days=selectedRenewalDeliveryDays();if(!days.length){toast('Please choose at least one renewal delivery day.');return null}return {status,method,mealPackageId:pkg.id,packageLabel:pkg.label,amount:pkg.price||0,selectedDeliveryDays:days,excludedDays:allWeekDays().filter(day=>!days.includes(day)),includeFriday:days.includes('Friday'),deliveryDaysPerWeek:days.length,created:new Date().toISOString().slice(0,10),approvedBy:'',approvedDate:'',...extra}};
$('#choosePaymentProof')?.addEventListener('click',()=>$('#portalPaymentProof')?.click());
$('#portalPaymentProof')?.addEventListener('change',()=>{const file=$('#portalPaymentProof')?.files?.[0];if(!validateProof(file))return;readProof(file,data=>{setCustomerPayment(c,'Waiting Admin Approval',{method:'Bank/Card Transfer',proofName:file.name,proofData:data||'',uploadedDate:new Date().toISOString().slice(0,10),note:'Payment proof uploaded by customer'});toast('Payment proof uploaded. CEO/Admin will verify it.');renderPortal()})});
$('#markCashPayment')?.addEventListener('click',()=>{setCustomerPayment(c,'Cash Pending',{method:'Cash',proofName:'',proofData:'',uploadedDate:new Date().toISOString().slice(0,10),note:'Customer selected cash payment'});toast('Cash payment request sent. CEO/Admin will approve after receiving cash.');renderPortal()});
$('#renewalPackage')?.addEventListener('change',()=>{const pkg=packageById($('#renewalPackage').value);const amount=$('#renewalAmount');if(amount)amount.textContent=money(pkg.price||0)});
document.querySelectorAll('input[name="renewalDeliveryDay"]').forEach(input=>input.addEventListener('change',updateRenewalDays));
$('#keepPreviousRenewalDays')?.addEventListener('click',()=>{const previous=Array.isArray(c.selectedDeliveryDays)&&c.selectedDeliveryDays.length?c.selectedDeliveryDays:allWeekDays().filter(day=>!customerExcludedDays(c).includes(day));document.querySelectorAll('input[name="renewalDeliveryDay"]').forEach(input=>{input.checked=previous.includes(input.value)});updateRenewalDays();toast('Previous delivery days selected')});
updateRenewalDays();
$('#uploadRenewalProof')?.addEventListener('click',()=>$('#renewalPaymentProof')?.click());
$('#renewalPaymentProof')?.addEventListener('change',()=>{const file=$('#renewalPaymentProof')?.files?.[0];if(!validateProof(file))return;const pkg=packageById($('#renewalPackage')?.value||c.mealPackageId||'3m1s');readProof(file,data=>{const request=renewalPayload('Renewal Waiting Admin Approval','Bank/Card Transfer',pkg,{proofName:file.name,proofData:data||''});if(!request)return;c.renewalRequest=request;saveCustomerState(c);if(typeof updateRequestBadge==='function')updateRequestBadge();toast('Renewal receipt uploaded. CEO/Admin will approve the renewal.');renderPortal()})});
$('#renewalCashRequest')?.addEventListener('click',()=>{const pkg=packageById($('#renewalPackage')?.value||c.mealPackageId||'3m1s');const request=renewalPayload('Renewal Cash Pending','Cash',pkg,{proofName:'',proofData:''});if(!request)return;c.renewalRequest=request;saveCustomerState(c);if(typeof updateRequestBadge==='function')updateRequestBadge();toast('Renewal cash request sent to CEO/Admin.');renderPortal()});
document.querySelectorAll('.payment-proof-thumb').forEach(btn=>btn.addEventListener('click',()=>openPaymentProofModal(btn.dataset.proofName,btn.dataset.proofData)))
}
function openPaymentProofModal(name,data){let modal=$('#paymentProofModal');if(!modal){modal=document.createElement('div');modal.id='paymentProofModal';modal.className='bmi-report-modal';document.body.appendChild(modal)}modal.innerHTML='<div class="bmi-report-dialog"><div class="bmi-report-head"><div><strong>Payment Proof</strong><span>'+escHtml(name||'Uploaded proof')+'</span></div><button type="button" class="bmi-report-close" aria-label="Close payment proof">Close</button></div>'+(data?'<img src="'+data+'" alt="Payment proof full view">':'<div class="bmi-report-pdf"><b>Payment Proof File</b><span>'+escHtml(name||'Uploaded file')+'</span></div>')+'</div>';modal.classList.add('open');$('.bmi-report-close')?.addEventListener('click',()=>modal.classList.remove('open'))}
function customerPortalIcon(name){const icons={home:'<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',menu:'<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/><path d="M8 6v12"/></svg>',delivery:'<svg viewBox="0 0 24 24"><path d="M3 7h11v10H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>',subscription:'<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4M16 3v4M4 11h16"/><path d="M9 15h6"/></svg>',profile:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',bell:'<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',eye:'<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',card:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h3"/></svg>',target:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',logout:'<svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 3v18"/></svg>'};return icons[name]||icons.home}
function portalMealDay(){const day=dayNameFromDate(dashboardDate());return day==='Friday'?'Thursday':day}
function portalMealSlots(c){const pkg=customerSafePackage(c);const slots=(pkg.meals||[]).slice();if(Number(pkg.mealCount||0)>=4&&!slots.includes('Extra Meal'))slots.push('Extra Meal');if(Number(pkg.snacks||0)>=1)slots.push('Snack 1');if(Number(pkg.snacks||0)>=2)slots.push('Snack 2');return slots.length?slots:['Lunch','Dinner']}
function portalSlotType(slot){if(/^snack/i.test(String(slot||'')))return 'Snacks';if(/extra meal/i.test(String(slot||'')))return 'Extra Meal';return String(slot||'Lunch')}
function portalSlotTime(slot){const key=portalSlotType(slot);const times={Breakfast:'08:00 AM',Lunch:'12:30 PM','Extra Meal':'03:30 PM',Snacks:'04:30 PM',Dinner:'07:30 PM'};return times[key]||'08:30 AM'}
function portalSlotMinutes(slot){const key=portalSlotType(slot);return {Breakfast:480,Lunch:750,'Extra Meal':930,Snacks:990,Dinner:1170}[key]??750}
function portalSavedMenuChoice(c,day,slot){const week=(c.weeks||[])[0]||{};const source=day==='Friday'?(week.fridayOptions||{}):((week.dayMenuOptions||{})[day]||week.menuOptions||{});const type=portalSlotType(slot);if(type==='Snacks'){const snacks=Array.isArray(source.Snacks)?source.Snacks:(source.Snacks?[source.Snacks]:[]);const snackIndex=/2/.test(String(slot))?1:0;return snacks[snackIndex]||''}return source[type]||''}
function portalFoodImage(day,type,name,index){const shared=menuItemPhoto(day,type,index,name);if(shared)return shared;try{const data=getExploreMenu();const active=data.find(d=>d.day===day)||data[0];const row=(active?.meals?.[type]||[]).find(item=>item.name===name)||(active?.meals?.[type]||[])[Number(index)||0];if(row?.image)return row.image}catch(e){}return exploreFoodImage(name,type)}
function portalMealFromChoice(c,day,slot){const selected=String(portalSavedMenuChoice(c,day,slot)||'').trim();const baseType=portalSlotType(slot);let type=baseType==='Extra Meal'?'Lunch':baseType;let name=selected;let status=selected?'Selected by you':'Kitchen Choice';if(/^Lunch\s+-\s+/i.test(name)){type='Lunch';name=name.replace(/^Lunch\s+-\s+/i,'').trim()}else if(/^Dinner\s+-\s+/i.test(name)){type='Dinner';name=name.replace(/^Dinner\s+-\s+/i,'').trim()}else if(baseType==='Extra Meal'&&name){const lunchList=weeklyMenu[day]?.Lunch||[];const dinnerList=weeklyMenu[day]?.Dinner||[];type=dinnerList.includes(name)?'Dinner':(lunchList.includes(name)?'Lunch':'Lunch')}if(!name||name==='Kitchen Choice'){name=(weeklyMenu[day]?.[type]||[])[0]||'Kitchen Choice';status='Kitchen Choice'}const index=Math.max(0,(weeklyMenu[day]?.[type]||[]).findIndex(x=>x===name));const safeIndex=index>=0?index:0;const n=calculatedNutrition(day,type,safeIndex,c.cat||'A');return {slot,type,name,status,time:portalSlotTime(slot),day,image:portalFoodImage(day,type,name,safeIndex),nutrition:{calories:Number(n.calories||0),protein:Number(n.protein||0),carbs:Number(n.carbs||0),fat:Number(n.fat||0),hasData:!!n.hasData,method:n.method||''}}}
function customerTodayMeals(c){const day=portalMealDay();return portalMealSlots(c).map(slot=>portalMealFromChoice(c,day,slot))}
function customerTodayMeal(c){const meals=customerTodayMeals(c);const now=new Date();const minutes=now.getHours()*60+now.getMinutes();return meals.find(meal=>portalSlotMinutes(meal.slot)>=minutes)||meals[meals.length-1]||portalMealFromChoice(c,portalMealDay(),'Lunch')}
function customerTodayMealsModalHtml(c){const meals=customerTodayMeals(c);const day=portalMealDay();const cards=meals.map(meal=>'<article class="customer-today-menu-item"><img src="'+escAttr(meal.image)+'" alt="'+escAttr(meal.name)+'"><div class="customer-today-menu-copy"><span>'+escHtml(meal.slot)+'</span><h3>'+escHtml(meal.name)+'</h3><p>'+escHtml(meal.status)+' for '+escHtml(day)+'</p><div class="customer-today-macro-grid"><b>'+Math.round(meal.nutrition.calories)+'<small>kcal</small></b><b>'+niceMacro(meal.nutrition.protein)+'<small>P</small></b><b>'+niceMacro(meal.nutrition.carbs)+'<small>C</small></b><b>'+niceMacro(meal.nutrition.fat)+'<small>F</small></b></div></div></article>').join('');return '<div class="customer-today-menu-modal" id="customerTodayMenuModal" hidden><div class="customer-today-menu-backdrop" data-close-today-menu></div><section class="customer-today-menu-dialog" role="dialog" aria-modal="true" aria-labelledby="customerTodayMenuTitle"><div class="customer-today-menu-head"><div><span>Today&#39;s Meal Plan</span><h2 id="customerTodayMenuTitle">'+escHtml(day)+' Menu & Macros</h2><p>Your saved choices for today. Empty choices become Kitchen Choice.</p></div><button type="button" class="customer-today-menu-close" data-close-today-menu aria-label="Close today menu">Close</button></div><div class="customer-today-menu-list">'+cards+'</div></section></div>'}
function customerDaysLeft(c,progress){if(progress?.completionDate)return displayDate(progress.completionDate);if(validDateValue(c.subscriptionEnd))return displayDate(c.subscriptionEnd);return 'Pending setup'}
function customerPortalNotifications(c,progress){
const items=[];const p=ensurePaymentRecord(c);const pay=paymentStatusText(c);const today=new Date(dashboardDate());const expected=p.expectedDate&&validDateValue(p.expectedDate)?new Date(p.expectedDate):null;const overdue=expected&&expected<today&&!/paid/i.test(pay);const days=Number(progress?.remaining||0);const time=new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});const push=(type,title,detail,page,icon,priority='normal',action='View',status='New',meta='Today '+time)=>items.push({type,title,detail,page,icon,priority,action,status,meta});
if(!/paid/i.test(pay))push('payment',overdue?'Payment overdue':'Payment pending',overdue?'Please complete payment or contact support.':'Upload receipt or choose cash payment for approval.','payments','card',overdue?'urgent':'important',overdue?'Pay / Upload':'Upload proof',overdue?'Overdue':'Action needed');
if(/waiting|uploaded|cash pending|approval/i.test(pay))push('payment','Payment under review','CEO/Admin will approve once the receipt or cash is confirmed.','payments','card','important','Check status','Waiting approval');
if(/paid/i.test(pay))push('payment','Payment approved','Your payment is verified and your package is active.','payments','card','normal','View receipt','Approved');
if(days<=5&&days>0)push('subscription','Subscription ending soon',days+' delivery package(s) remaining. Renew before it finishes.','subscription','subscription','important','Renew','Expiring soon');
if(days===0)push('subscription','Subscription needs renewal','Your package is finished. Renew to continue delivery.','subscription','subscription','urgent','Renew now','Renewal needed');
if(/stopped|inactive/i.test(c.status||''))push('subscription','Subscription stopped','Your subscription is stopped. Contact support to restart.','subscription','subscription','urgent','Contact support','Stopped');
if(/paused/i.test(c.status||''))push('pause','Subscription paused','Your meal package is currently paused. Resume request is available.','subscription','subscription','important','Resume','Paused');
else if(c.resumeDate&&validDateValue(c.resumeDate))push('pause','Package resumed','Your subscription resumed on '+displayDate(c.resumeDate)+'.','subscription','subscription','normal','View','Resumed');
const pendingPause=pendingPauseRequest(c);if(pendingPause)push('pause',pendingPause.type+' request sent','Your request is waiting for CEO/Admin approval.','subscription','subscription','important','View request','Pending');
if(/trial/i.test(c.status||'')||/trial/i.test(c.trialStatus||''))push('subscription','Trial status update',c.trialStatus||'Your trial package is active.','subscription','subscription','important','View trial','Trial');
push('menu','Choose your menu','New weekly menu selection is ready. Unselected meals become Kitchen Choice.','menu','menu','important','Choose menu','Menu needed');
push('menu','Kitchen Choice rule','If any meal is not selected before cut-off, the kitchen will choose it for you.','menu','menu','normal','View menu','Auto choice');
push('menu','Friday menu selection','Friday meals use Thursday menu choices. You can choose different Thursday and Friday packages.','menu','menu','normal','Choose Friday','Friday');
push('delivery','Today delivery scheduled','Delivery '+(c.deliveryTime||'08:30 AM')+' with '+customerDriver(c)+'.','delivery','delivery','normal','Track','Scheduled');
if(c.driverNote)push('delivery','Driver note updated',c.driverNote,'delivery','delivery','important','View delivery','Driver update');
if(c.notes)push('support','Food notes saved','Kitchen can see your latest food note.','profile','profile','normal','View notes','Saved');
push('support','Need help?','Contact the support team if you have a complaint, replacement request, or delivery issue.','profile','profile','normal','Contact support','Support');
push('account','Account active','Your customer portal is ready after CEO/Admin approval.','profile','profile','normal','View profile','Account');
return items;
}
function customerPortalNotificationHtml(c,progress){
const items=customerPortalNotifications(c,progress);const count=items.filter(x=>x.priority!=='normal').length||items.length;const rows=items.map(item=>'<article class="customer-notification-item '+escAttr(item.priority)+' '+escAttr(item.type)+'"><span class="portal-svg">'+customerPortalIcon(item.icon)+'</span><div><div class="customer-notification-meta"><small>'+escHtml(item.type)+'</small><i>'+escHtml(item.status)+'</i></div><b>'+escHtml(item.title)+'</b><p>'+escHtml(item.detail)+'</p><footer><span>'+escHtml(item.meta)+'</span><button type="button" data-portal-open="'+escAttr(item.page)+'">'+escHtml(item.action)+'</button></footer></div></article>').join('');
return '<div class="customer-notification-wrap"><button class="customer-icon-btn customer-notification-btn" id="customerNotificationBtn" type="button" aria-label="Customer notifications" aria-expanded="false"><span class="portal-svg">'+customerPortalIcon('bell')+'</span><b>'+count+'</b></button><div class="customer-notification-menu" id="customerNotificationMenu" aria-label="Customer notifications"><div class="customer-notification-head"><strong>Notifications</strong><small>'+count+' need attention</small></div>'+rows+'</div></div>';
}
function customerPortalHtml(c){
const pkg=customerSafePackage(c);
const progress=packageProgress(c);
const planPrice=packageById(c.mealPackageId||'3m1s').price||packages.find(p=>p.name===c.plan)?.price||0;
const todayMeal=customerTodayMeal(c);
const todayMenuModal=customerTodayMealsModalHtml(c);
const deliveryTime=escHtml(c.deliveryTime||'08:30 AM');
const deliveryWindow=escHtml(c.deliveryWindow||'08:00 - 09:00');
const driver=escHtml(customerDriver(c));
const friday=customerHasFriday(c);
const paymentText=paymentStatusText(c);
const pkgMeals=Number(pkg.mealCount||pkg.meals?.length||0);
const pkgSnacks=Number(pkg.snacks||0);
const portalActions='<div class="customer-app-actions">'+customerPortalNotificationHtml(c,progress)+'<div class="header-language-switch portal-language-switch" aria-label="Language selector"><button type="button" data-lang-switch="en">English</button><span>|</span><button type="button" data-lang-switch="ar">&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;</button></div></div>';
const bottomItems=[['Home','dashboard','home'],['Menu','menu','menu'],['Delivery','delivery','delivery'],['Subscription','subscription','subscription'],['Profile','profile','profile']];
const sideNav=bottomItems.map((item,i)=>'<a class="customer-side-link '+(i===0?'active':'')+'" href="#" data-portal-page="'+item[1]+'"><span class="portal-svg">'+customerPortalIcon(item[2])+'</span><b>'+item[0]+'</b></a>').join('');
const homeProgress=[
 ['Remaining Packages',String(progress.remaining||0),'from '+(progress.total||0)+' total','delivery'],
 ['Subscription Days Left',progress.remaining?String(progress.remaining):'0','Ends '+customerDaysLeft(c,progress),'subscription'],
 ['Payment Status',paymentText,/paid/i.test(paymentText)?'Verified':'Needs attention','card']
].map(x=>'<article class="portal-progress-card"><span class="portal-svg">'+customerPortalIcon(x[3])+'</span><div><b>'+escHtml(x[0])+'</b><strong>'+escHtml(x[1])+'</strong><small>'+escHtml(x[2])+'</small></div></article>').join('');
const trackingCards=[
 ['Calories / Category',(c.health?.calories||c.health?.nutrition?.approvedCalories||c.health?.nutrition?.systemRecommendedCalories||'-')+' kcal','Category '+escHtml(c.cat||'A'),'target'],
 ['Meals Today',String(pkgMeals+pkgSnacks),pkg.label,'menu'],
 ['Delivery Status','Scheduled',deliveryTime+' with '+driver,'delivery']
].map(x=>'<article><span class="portal-svg">'+customerPortalIcon(x[3])+'</span><div><b>'+escHtml(x[0])+'</b><strong>'+escHtml(x[1])+'</strong><small>'+escHtml(x[2])+'</small></div></article>').join('');
const deliveryRows=[['Area',c.area||'-'],['Zone',zoneShort(c.zone)],['Address',c.address||'-'],['Delivery Time',deliveryTime],['Delivery Window',deliveryWindow],['Driver',driver],['Google Location','<a class="map-link" target="_blank" href="'+customerMapLink(c)+'">View on Map</a>']];
const profileRows=[['Name',c.name||'-'],['Phone',c.phone||'-'],['Goal',c.goal||'-'],['Diet Preference',c.dietPreference||'-'],['Category','Category '+(c.cat||'A')],['Meal Package',pkg.label]];
const paymentRows=[['Current Package',c.plan||packagePlanName(c.mealPackageId)],['Meal Package',pkg.label],['Amount',money(planPrice)],['Payment Status',paymentText],['Received Deliveries',String(progress.received)],['Remaining Deliveries',String(progress.remaining)]];
const supportHtml='<section class="customer-card portal-section" data-portal-pages="profile support"><div class="customer-card-head"><h2>Support</h2><span>Contact Triangle Healthy Kitchen</span></div><div class="customer-note-tile kitchen"><b>Need Help?</b><p>Contact support or CEO directly from WhatsApp, Instagram, or Google review.</p>'+portalSocialHtml()+'</div></section>';
const settingsHtml='<section class="customer-card portal-section" data-portal-pages="profile settings"><div class="customer-card-head"><h2>Settings</h2><span>Language and account</span></div><div class="customer-note-tile kitchen"><b>Language</b><p>Use the English / Arabic switch in the top header.</p></div><button class="primary-btn light" type="button" id="portalLogoutSettings"><span class="portal-svg">'+customerPortalIcon('logout')+'</span> Logout</button></section>';
return '<div class="customer-app customer-mobile-portal" id="customerTop"><header class="customer-mobile-top"><div class="customer-mobile-brand"><img src="triangle-logo-badge-v2.png?v=20260712-09" alt="Triangle Healthy Kitchen logo"><div><strong>Triangle</strong><small>Healthy Kitchen</small><em>'+escHtml(c.name||'Customer')+'</em></div></div>'+portalActions+'</header><section class="customer-app-main customer-mobile-main"><div class="portal-section customer-home-section" data-portal-pages="dashboard"><section class="today-meal-card"><div class="today-meal-copy"><span>Next Meal Today</span><h1>'+escHtml(todayMeal.name)+'</h1><p>'+escHtml(todayMeal.slot)+' for '+escHtml(todayMeal.day)+' - delivery '+deliveryTime+'</p><button class="primary-btn green customer-side-link-inline" type="button" data-open-today-menu><span class="portal-svg">'+customerPortalIcon('eye')+'</span> View Menu</button></div><img src="'+escAttr(todayMeal.image)+'" alt="'+escAttr(todayMeal.name)+'"></section><div class="portal-progress-grid">'+homeProgress+'</div><section class="portal-tracking-card"><div><h2>Tracking</h2><p>Your package, meals and delivery status</p></div><div class="portal-tracking-grid">'+trackingCards+'</div></section></div><section class="customer-card portal-section" data-portal-pages="profile"><div class="customer-card-head"><h2>My Profile</h2><span>Personal and plan details</span></div>'+table(['Field','Details'],profileRows)+'</section><section class="customer-card portal-section" data-portal-pages="subscription payments dashboard"><div class="customer-card-head"><h2>Payments</h2><span>Upload proof or choose cash payment</span></div>'+table(['Field','Details'],paymentRows)+customerPaymentPortalHtml(c)+'</section><div class="customer-card-grid portal-section" data-portal-pages="delivery profile notes"><section class="customer-card" id="customerDelivery"><div class="customer-card-head"><h2>My Delivery</h2><span>Address and timing</span></div>'+table(['Field','Details'],deliveryRows)+'</section><section class="customer-card" id="customerNotes"><div class="customer-card-head"><h2>Food Notes</h2><span>Kitchen will see these notes</span></div><div class="customer-note-tile kitchen"><b>Kitchen Notes</b><p>'+escHtml(c.notes||'No notes added')+'</p></div><div class="customer-note-tile friday"><b>Friday Delivery</b><p>'+(friday?'Included for this customer':'Not included')+'</p></div>'+goalProgressHtml(c,progress)+'</section></div><div class="customer-card-grid portal-section" data-portal-pages="subscription pause"><div id="customerPause">'+pauseRequestHtml(c)+'</div><section class="customer-card" id="customerSubscription"><div class="customer-card-head"><h2>Subscription Changes</h2><span>Friday, package and balance updates</span></div>'+adjustmentHistoryHtml(c)+'</section></div><div class="portal-section" data-portal-pages="subscription reports dashboard">'+deliveryProgressHtml(c)+'</div><div class="portal-section" data-portal-pages="menu" id="customerMenu">'+customerMenuPortalHtml(c)+'</div>'+supportHtml+settingsHtml+'</section><nav class="customer-bottom-nav" aria-label="Customer portal navigation">'+sideNav+'</nav>'+todayMenuModal+'</div>'}

function bindPortalNavigation(){const show=page=>{document.querySelector('.customer-app')?.setAttribute('data-active-page',page);document.querySelectorAll('.customer-side-link').forEach(a=>a.classList.toggle('active',a.dataset.portalPage===page));document.querySelectorAll('.portal-section').forEach(section=>{const pages=(section.dataset.portalPages||'').split(/\s+/);section.classList.toggle('hidden',!pages.includes(page))});window.scrollTo({top:0,behavior:'smooth'})};document.querySelectorAll('.customer-side-link').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();show(link.dataset.portalPage||'dashboard')}));document.querySelectorAll('[data-portal-open]').forEach(btn=>btn.addEventListener('click',()=>show(btn.dataset.portalOpen||'dashboard')));show('dashboard')}
function bindCustomerNotifications(){const btn=$('#customerNotificationBtn');const menu=$('#customerNotificationMenu');if(!btn||!menu)return;const close=()=>{menu.classList.remove('open');btn.setAttribute('aria-expanded','false')};const outside=e=>{if(!e.target.closest('.customer-notification-wrap'))close()};btn.addEventListener('click',e=>{e.stopPropagation();const open=menu.classList.toggle('open');btn.setAttribute('aria-expanded',open?'true':'false');if(open)setTimeout(()=>document.addEventListener('click',outside,{once:true}),0)});menu.addEventListener('click',e=>{if(e.target.closest('[data-portal-open]'))close()})}
function bindCustomerTodayMenu(){const modals=$$('#customerTodayMenuModal');const modal=modals[modals.length-1];modals.slice(0,-1).forEach(old=>old.remove());const openBtn=document.querySelector('[data-open-today-menu]');if(!modal||!openBtn)return;if(modal.parentElement!==document.body)document.body.appendChild(modal);const close=()=>{modal.hidden=true;document.body.classList.remove('customer-today-menu-open');openBtn.focus()};openBtn.addEventListener('click',()=>{modal.hidden=false;document.body.classList.add('customer-today-menu-open');modal.querySelector('.customer-today-menu-list')?.scrollTo({top:0});modal.querySelector('.customer-today-menu-close')?.focus()});modal.querySelectorAll('[data-close-today-menu]').forEach(btn=>btn.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()})}
function renderPortal(){state.module='portal';const c=activeCustomer();if(!c){moduleFrame('Customer Portal','', '<div class="locked-panel"><h2>Customer not found</h2><p>Please login again or register as a new customer.</p></div>');return}moduleFrame('Customer Portal','',customerPortalHtml(c));$('#portalLogout')?.addEventListener('click',logoutAll);$('#portalLogoutSettings')?.addEventListener('click',logoutAll);bindPortalNavigation();bindCustomerNotifications();bindCustomerTodayMenu();bindPortalPause(c);bindPortalMenu(c);bindPortalPayment(c)}

function nutritionAdminCardHtml(h={},idPrefix='review',cat='A',edit=true){const n=h.nutrition||{};const dis=edit?'':'disabled';const approvedCalories=n.approvedCalories||h.calories||n.systemRecommendedCalories||'';const approvedProtein=n.approvedProtein||n.systemRecommendedProtein||'';const approvedCarbs=n.approvedCarbs||n.systemRecommendedCarbs||'';const approvedFat=n.approvedFat||n.systemRecommendedFat||'';const status=n.nutritionStatus||n.status||'Not Calculated';const review=n.requiresManualReview?'<span class="nutrition-warning">Manual Review: '+escHtml(n.manualReviewReason||'Required')+'</span>':'<span class="nutrition-ok">Pending nutrition approval</span>';return '<article class="nutrition-review-card span-2"><b>Automatic Nutrition Recommendation</b><div class="nutrition-review-grid"><span>Age: '+(h.age||'-')+'</span><span>Gender: '+escHtml(n.gender||h.gender||'-')+'</span><span>Goal: '+escHtml(n.goal||'-')+'</span><span>Activity: '+escHtml(n.activityLevel||'-')+'</span><span>Height: '+(h.height?h.height+' cm':'-')+'</span><span>Weight: '+(h.weight?h.weight+' kg':'-')+'</span><span>BMR: '+(n.calculatedBmr?Math.round(n.calculatedBmr)+' kcal':'-')+'</span><span>Activity Multiplier: '+(n.activityMultiplier||'-')+'</span><span>Maintenance Calories: '+(n.calculatedMaintenanceCalories?Math.round(n.calculatedMaintenanceCalories)+' kcal':'-')+'</span><span>Goal Adjustment: '+(n.goalAdjustmentPercentage>0?'+':'')+(n.goalAdjustmentPercentage??'-')+'%</span><span>Recommended Calories: '+(n.systemRecommendedCalories?n.systemRecommendedCalories+' kcal':'-')+'</span><span>Protein: '+(n.systemRecommendedProtein?n.systemRecommendedProtein+' g':'-')+'</span><span>Carbohydrates: '+(n.systemRecommendedCarbs?n.systemRecommendedCarbs+' g':'-')+'</span><span>Fat: '+(n.systemRecommendedFat?n.systemRecommendedFat+' g':'-')+'</span><span>Status: '+escHtml(status)+'</span>'+review+'</div><div class="review-edit-row nutrition-edit-row"><label class="review-edit-field"><span>Approved Calories</span><input id="'+idPrefix+'Calories" type="number" min="0" '+dis+' value="'+escAttr(approvedCalories)+'"></label><label class="review-edit-field"><span>Approved Protein</span><input id="'+idPrefix+'Protein" type="number" min="0" '+dis+' value="'+escAttr(approvedProtein)+'"></label><label class="review-edit-field"><span>Approved Carbs</span><input id="'+idPrefix+'Carbs" type="number" min="0" '+dis+' value="'+escAttr(approvedCarbs)+'"></label><label class="review-edit-field"><span>Approved Fat</span><input id="'+idPrefix+'Fat" type="number" min="0" '+dis+' value="'+escAttr(approvedFat)+'"></label><label class="review-edit-field"><span>Final Kitchen Category</span><select id="'+idPrefix+'Category" '+dis+'>'+mealCategories.map(x=>'<option value="'+x[0]+'" '+(x[0]===cat?'selected':'')+'>Category '+x[0]+'</option>').join('')+'</select></label></div><label class="review-edit-field nutrition-note-field"><span>Nutrition Notes</span><textarea id="'+idPrefix+'NutritionNotes" '+dis+' placeholder="Boss/Admin nutrition note">'+escHtml(n.nutritionNotes||'')+'</textarea></label><small>Automatic values are kept separately. Editing approved values will not overwrite the system recommendation.</small></article>'}
function saveNutritionReviewFields(target,prefix='review'){target.health=target.health||{};target.health.nutrition=target.health.nutrition||{};const n=target.health.nutrition;const calories=Number($('#'+prefix+'Calories')?.value||n.approvedCalories||target.health.calories||0);const protein=Number($('#'+prefix+'Protein')?.value||n.approvedProtein||0);const carbs=Number($('#'+prefix+'Carbs')?.value||n.approvedCarbs||0);const fat=Number($('#'+prefix+'Fat')?.value||n.approvedFat||0);const cat=$('#'+prefix+'Category')?.value||target.cat||'A';if(calories){n.approvedCalories=calories;target.health.calories=calories}if(protein)n.approvedProtein=protein;if(carbs)n.approvedCarbs=carbs;if(fat)n.approvedFat=fat;n.assignedCategory=cat;n.nutritionNotes=$('#'+prefix+'NutritionNotes')?.value||n.nutritionNotes||'';n.nutritionStatus=n.requiresManualReview?'Adjusted and Approved':'Approved';n.approvedAt=new Date().toISOString();n.approvedBy=roles[state.role]?.label||'CEO/Admin';target.cat=cat;return target}
function savePendingReviewEdits(index){const list=pendingCustomers();const p=list[Number(index)];if(!p)return null;saveNutritionReviewFields(p,'review');savePendingCustomers(list);return p}
function approvalStatusFromPlan(planPayment){
  if(planPayment?.custom)return {customerStatus:'Pending Admin Approval',trialStatus:'Custom Plan Review',paymentStatus:'Custom Plan Review'};
  if(planPayment?.paymentStatus==='Cash Pending')return {customerStatus:'Pending Admin Approval',trialStatus:planPayment.journey==='trial'?'Trial Cash Pending':'Subscription Cash Pending',paymentStatus:'Cash Pending'};
  if(planPayment?.paymentStatus==='Paid')return {customerStatus:'Active',trialStatus:planPayment.journey==='trial'?'Trial Active':'Active',paymentStatus:'Paid'};
  return {customerStatus:'Pending Admin Approval',trialStatus:planPayment?.journey==='trial'?'Trial Awaiting Payment':'Awaiting Payment',paymentStatus:planPayment?.paymentStatus||'Awaiting Payment'};
}
async function approvePendingCustomer(index){
  const list=pendingCustomers();let p=savePendingReviewEdits(index)||list[Number(index)];if(!p)return;
  const now=new Date().toISOString();const start=todayIso();const planPayment=p.registrationPlanPayment||collectApprovedFallbackPlan(p);const status=approvalStatusFromPlan(planPayment);const approver=roles[state.role]?.label||'CEO/Admin';
  const payment={...(p.payment||{}),status:status.paymentStatus,method:p.payment?.method||planPayment.paymentMethodLabel||'',amount:Number(p.payment?.amount||planPayment.total||paymentAmount(p)||0),orderId:p.payment?.orderId||planPayment.orderId||'',paymentId:p.payment?.paymentId||planPayment.paymentId||'',uploadedDate:p.payment?.uploadedDate||planPayment.confirmedAt||start,approvedBy:status.paymentStatus==='Paid'?approver:(p.payment?.approvedBy||''),approvedDate:status.paymentStatus==='Paid'?start:(p.payment?.approvedDate||''),note:p.payment?.note||'Registration payment/menu details connected from Step 12. CEO/Admin final approval remains required for cash/proof.'};
  const approved={...p,name:adminEnglishText(p.name),phone:p.phone,phoneVerified:!!p.phoneVerified,phoneVerifiedAt:p.phoneVerifiedAt||'',password:p.password||'',cat:p.cat||p.health?.nutrition?.assignedCategory||'A',zone:adminEnglishText(p.zone),zoneName:adminEnglishText(p.zoneName||zoneNameOnly(p.zone)),area:adminEnglishText(p.area),plan:adminEnglishText(p.plan||packagePlanName(planPayment.mealPackageId||p.mealPackageId)),notes:adminEnglishText(p.notes),deliveryNote:adminEnglishText(p.deliveryNote||''),address:adminEnglishText(p.address),streetNumber:adminEnglishText(p.streetNumber||p.deliveryAddress?.streetNumber||''),buildingNumber:adminEnglishText(p.buildingNumber||p.deliveryAddress?.buildingNumber||''),floorNumber:adminEnglishText(p.floorNumber||p.deliveryAddress?.floorNumber||''),unitNumber:adminEnglishText(p.unitNumber||p.deliveryAddress?.unitNumber||''),deliveryAddress:p.deliveryAddress||{},googleLocation:p.googleLocation||'',deliveryTime:p.deliveryTime||'08:30 AM',deliveryWindow:p.deliveryWindow||'08:00 - 09:00',status:status.customerStatus,trialStatus:status.trialStatus,trialDate:planPayment.journey==='trial'?start:'',mealPackageId:planPayment.mealPackageId||p.mealPackageId,customMeals:p.customMeals||0,customSnacks:p.customSnacks||0,includeFriday:!!planPayment.includeFriday||!!p.includeFriday,selectedDeliveryDays:planPayment.selectedDeliveryDays||p.selectedDeliveryDays||null,excludedDays:planPayment.excludedDays||p.excludedDays||((planPayment.includeFriday||p.includeFriday)?[]:['Friday']),subscriptionType:planPayment.packageType==='premium'?'Premium':(p.subscriptionType||'Standard'),deliveryDays:Number(planPayment.deliveryDays||p.deliveryDays||packageDeliveryTotal(p)),weeks:registrationMenuSelectionsToWeeks(planPayment,p.weeks),registrationMenuSelections:planPayment.menuSelections||p.registrationMenuSelections||[],registrationPlanPayment:planPayment,journey:planPayment.journey||p.journey||'',trialDays:Number(planPayment.trialDays||p.trialDays||0),subscriptionDuration:planPayment.duration||p.subscriptionDuration||'',subscriptionStart:start,subscriptionEnd:'Pending setup',paymentStatus:status.paymentStatus,payment,goal:adminEnglishText(p.goal||'Build Muscle'),dietPreference:adminEnglishText(p.dietPreference||'Balanced'),health:p.health||{},source:p.source||'Website Registration',createdAt:p.createdAt||p.registeredAt||now,registeredAt:p.registeredAt||p.createdAt||now,approvedAt:now,approvedBy:approver,pauseRequests:p.pauseRequests||[],trialTimeline:[...(Array.isArray(p.trialTimeline)?p.trialTimeline:[]),{date:start,text:'New customer registered from website.'},{date:start,text:'Approved by '+approver+'. Plan/payment/menu details connected.'},{date:start,text:'Current payment status: '+status.paymentStatus+'.'}],history:[...(Array.isArray(p.history)?p.history:[]),{date:now,action:'Customer Approved',details:'Registration connected to customers, dashboard, payments, kitchen and delivery.',changedBy:approver}]};
  approved.subscriptionEnd=packageProgress(approved).completionDate||'Pending setup';
  if(p.backendId&&window.THK_API?.enabled){
    try{
      const result=await window.THK_API.approveRegistration(p.backendId,{customer:approved,payment});
      if(result?.customer)Object.assign(approved,result.customer);
    }catch(apiError){
      if(!backendFallbackAllowed(apiError)){
        toast(backendApiErrorMessage(apiError,'Approval could not be saved to the secure database.'));
        return;
      }
    }
  }
  const existingIndex=customers.findIndex(c=>customerRecordKey(c)===customerRecordKey(approved));
  if(existingIndex>=0)customers[existingIndex]=approved;else customers.push(approved);
  persistApprovedCustomer(approved);
  list.splice(Number(index),1);savePendingCustomers(list);toast(adminEnglishText(p.name)+' approved and connected to dashboard.');renderCustomers();
}
function collectApprovedFallbackPlan(p){const pkg=packageById(p.mealPackageId||'3m1s');return {journey:p.journey||'trial',trialDays:Number(p.trialDays||1),duration:p.subscriptionDuration||'',packageType:p.subscriptionType||'standard',mealPackageId:pkg.id,packageLabel:pkg.label,dailyPrice:Number(((pkg.price||0)/24).toFixed(2)),deliveryDays:Number(p.deliveryDays||packageDeliveryTotal(p)),selectedDeliveryDays:p.selectedDeliveryDays||null,excludedDays:p.excludedDays||null,includeFriday:!!p.includeFriday,total:Number(p.payment?.amount||pkg.price||0),custom:!!pkg.custom,paymentMethodLabel:p.payment?.method||'',paymentStatus:p.paymentStatus||p.payment?.status||'Awaiting Payment',orderId:p.payment?.orderId||'',paymentId:p.payment?.paymentId||'',confirmedAt:p.payment?.uploadedDate||'',menuSelections:p.registrationMenuSelections||[]}}
function removePendingCustomer(index){const list=pendingCustomers();const p=list[Number(index)];if(!p)return;list.splice(Number(index),1);savePendingCustomers(list);toast(p.name+' registration removed');renderCustomers()}
function pendingMenuSummaryHtml(p){const rows=[];(p.weeks||defaultWeekSelections()).forEach(w=>{const regular=Object.entries(w.menuOptions||{}).map(([type,opt])=>type+': '+formatSelectedOptions(type,opt)).join(' | ');rows.push([p.name||'-','Week '+w.week,'Regular days',regular||'-',w.notes||'-']);if(customerHasFriday(p)){const friday=Object.entries(w.fridayOptions||{}).map(([type,opt])=>type+': '+formatSelectedOptions(type,opt)).join(' | ');rows.push([p.name||'-','Week '+w.week,'Friday only',friday||'No Friday choices selected yet',w.notes||'-'])}});return table(['Customer','Week','Day Type','Menu Selection','Week Notes'],rows)}
function bmiReportPreviewHtml(report,source,index){const openBtn=report?'<button type="button" class="primary-btn light open-bmi-report" data-report-source="'+source+'" data-report-index="'+index+'">Open BMI Report</button>':'';if(!report)return '<div class="admin-report-preview empty">No report uploaded</div>';if(report.previewData)return '<div class="admin-report-preview"><img src="'+report.previewData+'" alt="Uploaded BMI report"><span>'+escHtml(report.name||'BMI report image')+'</span>'+openBtn+'</div>';return '<div class="admin-report-preview pdf"><b>PDF</b><span>'+escHtml(report.name||'BMI report uploaded')+'</span>'+openBtn+'</div>'}
function customerBmiReportHtml(c,index,edit=false){const h=c.health||{};return '<section class="customer-bmi-box span-2"><div class="panel-header"><div><h2>BMI / Body Report</h2><span class="sub">Boss/Admin can adjust final calories, macros and kitchen category.</span></div></div>'+bmiReportPreviewHtml(h.bmiReport,'customer',index)+'<div class="report-mini-grid"><span>BMI: '+(h.bmi||h.reportMetrics?.bmi||'-')+'</span><span>Body Fat: '+(h.reportMetrics?.bodyFat?h.reportMetrics.bodyFat+'%':'-')+'</span><span>Muscle: '+(h.reportMetrics?.muscle?h.reportMetrics.muscle+' kg':'-')+'</span><span>Report BMR: '+(h.reportMetrics?.bmr?h.reportMetrics.bmr+' kcal':'-')+'</span></div>'+nutritionAdminCardHtml(h,'detail',c.cat||'A',edit)+'</section>'}function openBmiReportModal(source,index){const report=reportBySource(source,index);if(!report){toast('No BMI report uploaded for this customer');return}let modal=$('#bmiReportModal');if(!modal){modal=document.createElement('div');modal.id='bmiReportModal';modal.className='bmi-report-modal';document.body.appendChild(modal)}const body=report.previewData?'<img src="'+report.previewData+'" alt="Uploaded BMI report full view">':'<div class="bmi-report-pdf"><b>PDF Report</b><span>'+escHtml(report.name||'BMI report uploaded')+'</span><small>PDF preview will open when backend storage is connected.</small></div>';modal.innerHTML='<div class="bmi-report-dialog"><div class="bmi-report-head"><div><strong>BMI / Body Report</strong><span>'+escHtml(report.name||'Uploaded report')+'</span></div><button type="button" class="bmi-report-close" aria-label="Close BMI report">Close</button></div>'+body+'</div>';modal.classList.add('open');$('.bmi-report-close')?.addEventListener('click',()=>modal.classList.remove('open'))}
function reviewInfoRow(label,value){return '<div class="review-info-row"><span>'+escHtml(label)+'</span><strong>'+value+'</strong></div>'}
function pendingReviewCard(num,title,body,extra=''){return '<article class="approval-card"><div class="approval-card-title"><h3>'+num+'. '+escHtml(title)+'</h3><button type="button" class="approval-mini-btn '+extra+'">Edit</button></div>'+body+'</article>'}
function nutritionDonutHtml(n){const calories=Number(n.systemRecommendedCalories||0);const protein=Number(n.systemRecommendedProtein||0);const carbs=Number(n.systemRecommendedCarbs||0);const fat=Number(n.systemRecommendedFat||0);const pCal=protein*4,cCal=carbs*4,fCal=fat*9,total=Math.max(1,pCal+cCal+fCal);const p=Math.round((pCal/total)*100);const c=Math.round((cCal/total)*100);const f=Math.max(0,100-p-c);return '<div class="macro-donut-wrap"><div class="macro-donut" style="--protein:'+p+'%;--carbs:'+c+'%;--fat:'+f+'%"><strong>'+escHtml(calories||'-')+'</strong><span>kcal</span></div><div class="macro-legend"><span><i class="protein"></i>P <b>'+escHtml(protein||'-')+'g ('+p+'%)</b></span><span><i class="carbs"></i>C <b>'+escHtml(carbs||'-')+'g ('+c+'%)</b></span><span><i class="fat"></i>F <b>'+escHtml(fat||'-')+'g ('+f+'%)</b></span></div></div>'}
function reviewNoteCard(title,text){return '<article><b>'+escHtml(title)+'</b><p>'+adminCustomerValue(text||'-')+'</p><small>'+new Date().toLocaleDateString('en-GB')+'</small></article>'}
function pendingReviewActionsHtml(index){return '<div class="approval-action-buttons"><button type="button" class="primary-btn light action-edit-calories">Edit Calories</button><button type="button" class="primary-btn light action-edit-protein">Edit Protein</button><button type="button" class="primary-btn light action-edit-carbs">Edit Carbohydrates</button><button type="button" class="primary-btn light action-edit-fat">Edit Fat</button><button type="button" class="primary-btn light action-change-category">Change Category</button><button type="button" class="primary-btn light action-assign-driver">Assign Driver</button><button type="button" class="primary-btn light action-start-trial">Start Trial</button><button type="button" class="primary-btn light action-pause-subscription">Pause Subscription</button><button type="button" class="primary-btn light action-more-info">Request More Info</button><button type="button" class="primary-btn danger remove-pending" data-pending-index="'+index+'">Reject Plan</button></div>'}function pendingReviewHtml(p,index){
const h=p.health||{};
const rm=h.reportMetrics||{};
const n=h.nutrition||{};
const rec=p.cat||n.assignedCategory||'C';
const pkg=packageById(p.mealPackageId||'3m1s');
const status=n.nutritionStatus||n.status||'Pending Approval';
const calcTime=n.calculatedAt?new Date(n.calculatedAt).toLocaleString():'System generated';
const payment=p.payment||{};
const paymentStatus=payment.status||p.paymentStatus||'Awaiting Payment / Trial';
const paymentAmountValue=pkg.price||packages.find(x=>x.name===p.plan)?.price||0;

const allergyText=(p.allergies||[]).length?(p.allergies||[]).join(', '):'None';
const dislikeText=(p.dislikes||[]).length?(p.dislikes||[]).join(', '):'None';
const medicalText=(p.medical||[]).filter(x=>x!=='None').join(', ')||'None';
const personal=pendingReviewCard('1','Personal Information',reviewInfoRow('Full Name',adminCustomerValue(p.name||'-'))+reviewInfoRow('Date of Birth',escHtml(displayBirthDate(h.birthDate||''))+' '+(h.age?'('+h.age+' years)':''))+reviewInfoRow('Gender',adminCustomerValue(h.gender||'-'))+reviewInfoRow('Nationality','Qatar / Not set')+reviewInfoRow('Preferred Language',adminCustomerValue(p.language||'English')));
const body=pendingReviewCard('2','Goal & Body Information',reviewInfoRow('Goal',adminCustomerValue(p.goal||'-'))+reviewInfoRow('Activity Level',escHtml(n.activityLevel||'-'))+reviewInfoRow('Height',h.height?escHtml(h.height+' cm'):'-')+reviewInfoRow('Current Weight',h.weight?escHtml(h.weight+' kg'):'-')+reviewInfoRow('Target Weight',h.targetWeight?escHtml(h.targetWeight+' kg'):'-')+reviewInfoRow('BMI',h.bmi?escHtml(String(h.bmi)):'-')+reviewInfoRow('BMI Classification','<span class="approval-pill warn">'+adminCustomerValue(h.status||'-')+'</span>'));
const diet=pendingReviewCard('3','Diet Preference',reviewInfoRow('Diet Preference',adminCustomerValue(p.dietPreference||'Balanced'))+reviewInfoRow('Dietary Restrictions','None'));
const allergiesHtml='<div class="allergy-head"><span>Allergies</span>'+(allergyText!=='None'?'<b>Allergy Alert</b>':'')+'</div><div class="tag-row">'+(p.allergies||['None']).map(x=>'<span class="soft-tag danger">'+adminCustomerValue(x)+'</span>').join('')+'</div><div class="allergy-head"><span>Dislikes</span></div><div class="tag-row">'+(p.dislikes||['None']).map(x=>'<span class="soft-tag amber">'+adminCustomerValue(x)+'</span>').join('')+'</div>';
const allergyCard=pendingReviewCard('4','Allergies & Dislikes',allergiesHtml);
const reportCard=pendingReviewCard('5','Medical & Body Report',reviewInfoRow('Medical Conditions',adminCustomerValue(medicalText))+reviewInfoRow('Medications','None')+reviewInfoRow('Other Notes','None')+bmiReportPreviewHtml(h.bmiReport,'pending',index)+'<div class="report-mini-grid approval-report-grid"><span>BMI: '+(rm.bmi||h.bmi||'-')+'</span><span>Body Fat: '+(rm.bodyFat?rm.bodyFat+'%':'-')+'</span><span>Muscle: '+(rm.muscle?rm.muscle+' kg':'-')+'</span><span>BMR: '+(rm.bmr?rm.bmr+' kcal':'-')+'</span></div>');
const nutrition='<section class="approval-card nutrition-approval-main"><div class="approval-card-title"><h3>6. Automatic Nutrition Recommendation</h3><span class="approval-pill good">System Generated</span></div><div class="nutrition-approval-grid"><div class="calc-summary"><b>Calculation Summary</b>'+reviewInfoRow('BMR (Resting Energy)',n.calculatedBmr?Math.round(n.calculatedBmr)+' kcal':'-')+reviewInfoRow('Activity Multiplier',escHtml(n.activityMultiplier||'-'))+reviewInfoRow('Maintenance Calories (TDEE)',n.calculatedMaintenanceCalories?Math.round(n.calculatedMaintenanceCalories)+' kcal':'-')+reviewInfoRow('Goal Adjustment',(n.goalAdjustmentPercentage>0?'+':'')+(n.goalAdjustmentPercentage??'-')+'%')+'<div class="system-calorie-box"><span>System Recommended Calories</span><strong>'+(n.systemRecommendedCalories?n.systemRecommendedCalories+' kcal':'-')+'</strong></div>'+reviewInfoRow('Rounded for Customer',n.systemRecommendedCalories?n.systemRecommendedCalories+' kcal/day':'-')+'<div class="auto-note">Automatic recommendation only. Final plan must be reviewed and approved by CEO/Admin or nutrition team.</div></div><div class="macro-summary"><b>Macronutrients (System Recommendation)</b>'+nutritionDonutHtml(n)+'<div class="macro-tile-row"><article><span>Calories</span><strong>'+(n.systemRecommendedCalories||'-')+'</strong><small>kcal</small></article><article><span>Protein</span><strong>'+(n.systemRecommendedProtein||'-')+'</strong><small>g</small></article><article><span>Carbohydrates</span><strong>'+(n.systemRecommendedCarbs||'-')+'</strong><small>g</small></article><article><span>Fat</span><strong>'+(n.systemRecommendedFat||'-')+'</strong><small>g</small></article></div></div></div></section>';
const category='<section class="approval-card kitchen-category-card"><div class="approval-card-title"><h3>7. Kitchen Category</h3><button type="button" class="approval-mini-btn action-change-category">Edit</button></div><div class="category-approval-grid"><div class="suggested-category"><span>System Suggested Category</span><strong>'+escHtml(rec)+'</strong><small>'+(n.assignedCategory==='Manual Review Required'?'Manual Review Required':'Review before approval')+'</small></div><label><span>Approved Category (CEO/Admin)</span><select id="reviewCategory">'+mealCategories.map(x=>'<option value="'+x[0]+'" '+(x[0]===rec?'selected':'')+'>Category '+x[0]+' - '+x[1]+'g/'+x[2]+'g cooked portions</option>').join('')+'</select><small>Not assigned until saved</small></label><label><span>Category Notes</span><textarea id="reviewNutritionNotes" maxlength="200" placeholder="Add notes about category...">'+escHtml(n.nutritionNotes||'')+'</textarea><small>0/200</small></label></div><div class="approved-macro-edit"><label><span>Approved Calories</span><input id="reviewCalories" type="number" min="0" value="'+escAttr(n.approvedCalories||h.calories||n.systemRecommendedCalories||'')+'"></label><label><span>Approved Protein</span><input id="reviewProtein" type="number" min="0" value="'+escAttr(n.approvedProtein||n.systemRecommendedProtein||'')+'"></label><label><span>Approved Carbs</span><input id="reviewCarbs" type="number" min="0" value="'+escAttr(n.approvedCarbs||n.systemRecommendedCarbs||'')+'"></label><label><span>Approved Fat</span><input id="reviewFat" type="number" min="0" value="'+escAttr(n.approvedFat||n.systemRecommendedFat||'')+'"></label></div></section>';
const packageCard=pendingReviewCard('8','Package & Subscription',reviewInfoRow('Meal Package',escHtml(pkg.custom?'Custom Plan':'Standard Plan'))+reviewInfoRow('Meals / Day',escHtml(pkg.label||'-'))+reviewInfoRow('Subscription Package',escHtml(p.plan||packagePlanName(p.mealPackageId)))+reviewInfoRow('Start Date (Requested)',escHtml(p.subscriptionStart||'-'))+reviewInfoRow('Start Date (Approved)','-')+reviewInfoRow('End Date','-')+reviewInfoRow('Trial Status',escHtml(p.trialStatus||'Not Started'))+reviewInfoRow('Status','<span class="approval-pill warn">Pending Approval</span>'));
const paymentProof=paymentProofPreview(payment);
const paymentCard=pendingReviewCard('9','Payment Information',reviewInfoRow('Payment Status','<span class="approval-pill blue">'+escHtml(paymentStatus)+'</span>')+reviewInfoRow('Payment Method',escHtml(payment.method||'Not selected'))+reviewInfoRow('Amount',money(paymentAmountValue))+reviewInfoRow('Transaction ID',escHtml(payment.transactionId||'-'))+reviewInfoRow('Payment Screenshot',paymentProof)+'<div class="split-actions"><button type="button" class="primary-btn green approval-verify-payment">Verify Payment</button><button type="button" class="primary-btn danger approval-reject-payment">Reject Payment</button></div>');
const deliveryCard=pendingReviewCard('10','Delivery Information',reviewInfoRow('Delivery Place',adminCustomerValue(p.deliveryPreference||'-'))+reviewInfoRow('Zone / Area',adminCustomerValue(zoneShort(p.zone))+' / '+adminCustomerValue(p.area||'-'))+reviewInfoRow('Street / Building',adminCustomerValue([p.streetNumber?'Street '+p.streetNumber:'',p.buildingNumber?'Building '+p.buildingNumber:''].filter(Boolean).join(' / ')||'-'))+reviewInfoRow('Floor / Unit',adminCustomerValue([p.floorNumber?'Floor '+p.floorNumber:'',p.unitNumber?'Unit '+p.unitNumber:''].filter(Boolean).join(' / ')||'-'))+reviewInfoRow('Address',adminCustomerValue(p.address||'-'))+reviewInfoRow('Google Location','<a class="map-link" target="_blank" href="'+(p.googleLocation||mapsLink(p.area,p.address))+'">View on Map</a>')+reviewInfoRow('Preferred Time',escHtml(p.deliveryTime||'-'))+reviewInfoRow('Assigned Driver',escHtml(assignedDriver(p.zone)))+reviewInfoRow('Delivery Notes',adminCustomerValue(p.deliveryNote||'No delivery note')));
const notes='<section class="approval-card notes-approval-card"><div class="approval-card-title"><h3>11. Notes</h3><button type="button" class="approval-mini-btn">Edit</button></div><div class="approval-notes-grid">'+reviewNoteCard('Customer Notes','Registration submitted from customer portal.')+reviewNoteCard('Kitchen Notes',p.notes||'No kitchen notes')+reviewNoteCard('Nutrition Notes',n.nutritionNotes||'Monitor calories after approval.')+reviewNoteCard('Delivery Notes',p.deliveryNote||'No delivery note')+reviewNoteCard('Admin Internal Notes','Pending CEO/Admin approval.')+'</div></section>';
const history='<section class="approval-card history-approval-card"><div class="approval-card-title"><h3>12. History & Activity</h3><button type="button" class="approval-mini-btn">Edit</button></div>'+table(['Date & Time','Action','Details','Changed By'],[[calcTime,'Automatic Calculation','Nutrition plan calculated automatically','System'],[calcTime,'Customer Registration','Customer registered and details submitted','Customer'],[calcTime,'Document Upload',h.bmiReport?'Body report uploaded':'No body report uploaded','Customer']])+'</section>';
const actionCenter=pendingReviewCard('13','Action Center',pendingReviewActionsHtml(index));
return '<section class="approval-workspace"><div class="approval-topbar"><div><h2>Customer Review & Nutrition Approval</h2><span class="approval-pill warn">Pending Approval</span></div><div class="approval-main-actions"><button class="primary-btn green approve-customer" data-pending-index="'+index+'">Approve Customer</button><button class="primary-btn green save-pending-review" data-pending-index="'+index+'">Approve Nutrition Plan</button><button class="primary-btn light save-pending-review" data-pending-index="'+index+'">Edit Customer</button><button class="primary-btn danger remove-pending" data-pending-index="'+index+'">Reject Customer</button><button class="primary-btn light" id="backPendingList">Back</button></div></div><div class="approval-profile-strip"><div class="approval-avatar"><span>'+escHtml((p.name||'C').trim().charAt(0).toUpperCase())+'</span></div><div><h1>'+adminCustomerValue(p.name||'-')+'</h1><span class="approval-pill good">New Registration</span>'+reviewInfoRow('Customer ID','THK-'+String(index+1).padStart(4,'0'))+reviewInfoRow('Registered',calcTime)+'</div><div>'+reviewInfoRow('Phone',escHtml(p.phone||'-'))+reviewInfoRow('WhatsApp','Preferred')+reviewInfoRow('Language',adminCustomerValue(p.language||'English'))+reviewInfoRow('Location',adminCustomerValue((p.area||'-')+', Qatar'))+'</div><div>'+reviewInfoRow('Status','<span class="approval-pill warn">Pending Approval</span>')+reviewInfoRow('Assigned Admin','Boss Admin')+'</div><div>'+reviewInfoRow('Source','Website')+reviewInfoRow('Customer Since',new Date().toLocaleDateString('en-GB'))+'</div></div><div class="approval-layout"><div class="approval-left">'+personal+body+diet+allergyCard+reportCard+'</div><div class="approval-center">'+nutrition+category+notes+history+'</div><div class="approval-right">'+packageCard+paymentCard+deliveryCard+actionCenter+'</div></div><footer class="approval-footer"><span>System values are automatic recommendations only. Final plan must be reviewed and approved.</span><span>Calculated At: '+calcTime+'</span><span>Approved By: -</span></footer></section>'
}function pendingCustomerRows(){const list=pendingCustomers();if(!list.length)return '<div class="locked-panel"><h2>No pending registrations</h2><p>New customer signup requests will appear here.</p></div>';return table(['Name','Phone','BMI','Calories','Package','Meal Package','Zone','Area','Time','Notes','Action'],list.map((p,i)=>[adminCustomerValue(p.name),escHtml(p.phone),p.health?.bmi||'-',p.health?.calories?escHtml(p.health.calories+' kcal'):'-',adminCustomerValue(p.plan),escHtml(packageById(p.mealPackageId).label),adminCustomerValue(zoneShort(p.zone)),adminCustomerValue(p.area),escHtml(p.deliveryTime||'-'),adminCustomerValue(p.notes||'-'),'<div class="action-pair"><button class="primary-btn light review-pending" data-pending-index="'+i+'">Review</button><button class="primary-btn green approve-customer" data-pending-index="'+i+'">Approve</button><button class="primary-btn danger remove-pending" data-pending-index="'+i+'">Remove</button></div>']))}
function openPendingReview(index){
  const list=pendingCustomers();
  const p=list[Number(index)];
  if(!p){toast('Pending customer not found');return}
  const box=$('#pendingReviewBox');
  if(!box)return;
  box.innerHTML=pendingReviewHtml(p,Number(index));
  box.scrollIntoView({behavior:'smooth',block:'start'});
  bindPendingApprovals();
  $('#backPendingList')?.addEventListener('click',()=>{box.innerHTML='';$('#pendingCustomerSection')?.scrollIntoView({behavior:'smooth',block:'start'})});
}
function bindPendingApprovals(){
  document.querySelectorAll('.review-pending').forEach(btn=>btn.addEventListener('click',()=>openPendingReview(btn.dataset.pendingIndex)));
  document.querySelectorAll('.save-pending-review').forEach(btn=>btn.addEventListener('click',()=>{const p=savePendingReviewEdits(btn.dataset.pendingIndex);if(p)toast('Review saved: Category '+p.cat+' / '+(p.health?.calories||'-')+' kcal')}));
  document.querySelectorAll('.approve-customer').forEach(btn=>btn.addEventListener('click',()=>approvePendingCustomer(btn.dataset.pendingIndex)));
  document.querySelectorAll('.remove-pending').forEach(btn=>btn.addEventListener('click',()=>removePendingCustomer(btn.dataset.pendingIndex)));
  const focusField=id=>{const el=$(id);if(el){el.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>el.focus(),250)}};
  document.querySelectorAll('.action-edit-calories').forEach(btn=>btn.addEventListener('click',()=>focusField('#reviewCalories')));
  document.querySelectorAll('.action-edit-protein').forEach(btn=>btn.addEventListener('click',()=>focusField('#reviewProtein')));
  document.querySelectorAll('.action-edit-carbs').forEach(btn=>btn.addEventListener('click',()=>focusField('#reviewCarbs')));
  document.querySelectorAll('.action-edit-fat').forEach(btn=>btn.addEventListener('click',()=>focusField('#reviewFat')));
  document.querySelectorAll('.action-change-category').forEach(btn=>btn.addEventListener('click',()=>focusField('#reviewCategory')));
  document.querySelectorAll('.action-assign-driver').forEach(btn=>btn.addEventListener('click',()=>{document.querySelector('.approval-right')?.scrollIntoView({behavior:'smooth',block:'start'});toast('Driver is assigned automatically by zone. Transportation Manager can change it in Delivery.')}));
  document.querySelectorAll('.action-start-trial').forEach(btn=>btn.addEventListener('click',()=>toast('Approve Customer first. The system will start Trial Day automatically.')));
  document.querySelectorAll('.action-pause-subscription').forEach(btn=>btn.addEventListener('click',()=>toast('Pause is available after customer activation.')));
  document.querySelectorAll('.action-more-info').forEach(btn=>btn.addEventListener('click',()=>toast('More info request noted for customer follow-up.')));
  document.querySelectorAll('.approval-verify-payment').forEach(btn=>btn.addEventListener('click',()=>toast('Payment verification will be completed in Payments after proof/cash is received.')));
  document.querySelectorAll('.approval-reject-payment').forEach(btn=>btn.addEventListener('click',()=>toast('Payment rejection action is available after a proof upload.')));
}function profileInitials(label){return (label||'TH').split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'TH'}
function syncProfileMenu(){
  const r=roles[state.role];
  const label=r?.label||'Not signed in';
  const role=r?.hint||r?.label||'Team';
  const initials=profileInitials(label);
  const menuName=$('#profileMenuName');
  const menuRole=$('#profileMenuRole');
  const menuAvatar=$('#profileMenuAvatar');
  if(menuName)menuName.textContent=label;
  if(menuRole)menuRole.textContent=role;
  if(menuAvatar)menuAvatar.textContent=initials;
}
function closeProfileMenu(){
  const wrap=$('#profileMenuWrap');
  const btn=$('#profileMenuBtn');
  wrap?.classList.remove('open');
  btn?.setAttribute('aria-expanded','false');
}
function bindProfileMenu(){
  const wrap=$('#profileMenuWrap');
  const btn=$('#profileMenuBtn');
  if(!wrap||wrap.dataset.bound==='1')return;
  wrap.dataset.bound='1';
  btn?.addEventListener('click',e=>{
    e.stopPropagation();
    const open=!wrap.classList.contains('open');
    wrap.classList.toggle('open',open);
    btn.setAttribute('aria-expanded',String(open));
    syncProfileMenu();
  });
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))closeProfileMenu()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeProfileMenu()});
}
function logoutAll(){if(window.THK_API?.enabled&&window.THK_API.csrfToken)window.THK_API.logout().catch(()=>{});closeProfileMenu();state.role=null;state.customerPhone=null;if(realDataMode){customers.length=0;backendPendingCustomerCache=[]}document.body.classList.add('locked-app');document.body.classList.remove('customer-mode');showLoginScreen();const name=$('#accountName');const role=$('#accountRoleText');const avatar=document.querySelector('.profile-avatar');if(name)name.textContent='Not signed in';if(role)role.textContent='Team';if(avatar)avatar.textContent='TH';syncProfileMenu();toast('Logged out')}
function customerStatsKpis(){return kpis([['Total Customers',customers.length],['Active',customers.filter(isOperationalCustomer).length],['With Notes',customers.filter(c=>String(c.notes||'').trim()).length],['Custom Packages',customers.filter(c=>/custom/i.test(String(c.plan||c.status||''))).length]])}
function renderCustomers(){state.module='customers';const editable=canEdit();moduleFrame('Customers','',customerStatsKpis()+'<section class="panel" id="pauseRequestSection" style="margin-bottom:14px"><div class="panel-header"><div><h2>Pending Pause / Resume Requests</h2><span class="sub">Approve or decline customer portal requests.</span></div></div>'+pauseRequestsRows()+'</section><section class="panel" id="pendingCustomerSection" style="margin-bottom:14px"><div class="panel-header"><div><h2>Pending Customer Registrations</h2><span class="sub">New signup requests waiting for Boss/Admin approval.</span></div></div>'+pendingCustomerRows()+'<div id="pendingReviewBox" class="pending-review-wrap"></div></section><div class="customer-stack"><section class="panel customer-directory-panel"><div class="panel-header"><div><h2>Customer Directory</h2><span class="sub">Search customers, then open the full details below.</span></div></div><div class="form customer-search-form"><label><span>Search Customer Name</span><input id="customerSearch" placeholder="Enter customer name"></label></div><div id="customerResults">'+customerRows(customers)+'</div></section><section class="panel customer-details-panel" id="customerDetailsSection"><div class="panel-header"><h2>Customer Details</h2><span class="sub">'+(editable?'Administration edit enabled':'View only')+'</span></div><div id="customerDetailBox">'+customerForm(customers[selectedCustomerIndex],editable)+'</div></section></div>');$('#customerSearch').addEventListener('input',e=>{$('#customerResults').innerHTML=customerRows(customers.filter(c=>c.name.toLowerCase().includes(e.target.value.toLowerCase())));bindCustomerButtons(editable)});bindCustomerButtons(editable);bindZoneArea(document);bindWeekPackageActions();$('#detailMealPackage')?.addEventListener('change',refreshWeekPlannerForPackage);$('#detailIncludeFriday')?.addEventListener('change',refreshWeekPlannerForPackage);bindPendingApprovals();bindPauseApprovals();bindAdjustmentActions(editable);bindDirectPauseActions(editable);if(state.focusApprovals){const target=state.focusApprovals==='pauses'?'#pauseRequestSection':'#pendingCustomerSection';state.focusApprovals=false;setTimeout(()=>document.querySelector(target)?.scrollIntoView({behavior:'smooth',block:'start'}),80)}}
function customerRows(list){return table(['Name','Category','Zone','Area','Time','Driver','Package','Map','Action'],list.map((c,i)=>[c.name,badge(c.cat,i),zoneShort(c.zone),c.area||'-',c.deliveryTime||'-',customerDriver(c),c.plan,'<a class="map-link" target="_blank" href="'+customerMapLink(c)+'">Google Location</a>','<button class="primary-btn light customer-view" data-name="'+c.name+'">View</button>']))}
function customerActionMenuHtml(c,index){
  const paused=customerStatusValue(c)==='Paused';
  return '<div class="customer-more-menu" role="menu" data-open-customer-menu="'+index+'">'+
    '<button type="button" data-customer-action="pause" data-customer-index="'+index+'" '+(paused?'disabled':'')+'>Pause Customer</button>'+
    '<button type="button" data-customer-action="resume" data-customer-index="'+index+'" '+(!paused?'disabled':'')+'>Resume Customer</button>'+
    (canEdit()?'<button type="button" data-customer-action="addDays" data-customer-index="'+index+'">Add Package Days</button>':'')+
    '<label><span>Change Driver</span><select data-driver-change="'+index+'">'+driverOptionsHtml(customerDriver(c))+'</select></label>'+
    '<button type="button" data-customer-action="changeDriver" data-customer-index="'+index+'">Save Driver</button>'+
    '<button type="button" data-customer-action="whatsapp" data-customer-index="'+index+'">Send WhatsApp</button>'+
  '</div>'
}
function closeCustomerActionMenus(){document.querySelectorAll('.customer-more-menu').forEach(menu=>menu.remove())}
function toggleCustomerActionMenu(btn){
  const index=Number(btn.dataset.customerIndex);
  const c=customers[index];
  if(!c)return;
  const open=document.querySelector('.customer-more-menu[data-open-customer-menu="'+index+'"]');
  closeCustomerActionMenus();
  if(open)return;
  btn.closest('.customer-actions')?.insertAdjacentHTML('beforeend',customerActionMenuHtml(c,index));
  const menu=document.querySelector('.customer-more-menu[data-open-customer-menu="'+index+'"]');
  menu?.querySelectorAll('[data-customer-action]').forEach(actionBtn=>actionBtn.addEventListener('click',e=>{
    e.stopPropagation();
    handleCustomerAction(actionBtn.dataset.customerAction,actionBtn.dataset.customerIndex);
  }));
}
function handleCustomerAction(action,index){
  const c=customers[Number(index)];
  if(!c)return;
  if(action==='pause'){
    c.status='Paused';
    c.pauseStartDate=todayIso();
    saveCustomerState(c);
    toast(c.name+' paused');
    applyCustomerFilters();
    return;
  }
  if(action==='resume'){
    c.status='Active';
    c.resumeDate=todayIso();
    saveCustomerState(c);
    toast(c.name+' resumed');
    applyCustomerFilters();
    return;
  }
  if(action==='changeDriver'){
    const selected=document.querySelector('[data-driver-change="'+index+'"]')?.value||'';
    if(!selected){toast('Choose a driver first');return}
    c.driverOverride=selected===assignedDriver(c.zone)?'':selected;
    saveCustomerState(c);
    toast('Driver changed for '+c.name);
    applyCustomerFilters();
    return;
  }
  if(action==='addDays'){
    closeCustomerActionMenus();
    openAddCustomerDaysModal(Number(index));
    return;
  }
  if(action==='whatsapp'){
    const digits=String(c.phone||'').replace(/\D/g,'');
    if(!digits){toast('No WhatsApp number saved for '+c.name);return}
    window.open('https://wa.me/'+(digits.startsWith('974')?digits:'974'+digits),'_blank');
    closeCustomerActionMenus();
  }
}
function bindCustomerButtons(editable){
  document.querySelectorAll('.customer-view').forEach(btn=>btn.addEventListener('click',()=>{const idx=customers.findIndex(c=>c.name===btn.dataset.name);if(idx>=0)openCustomerDetails(idx)}));
  document.querySelectorAll('.customer-more').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();toggleCustomerActionMenu(btn)}));
  document.querySelectorAll('[data-customer-action]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();handleCustomerAction(btn.dataset.customerAction,btn.dataset.customerIndex)}));
  bindCustomerSave(editable);
  bindDirectPauseActions(editable)
}
document.addEventListener('click',e=>{if(!e.target.closest?.('.customer-actions'))closeCustomerActionMenus()});
function bindCustomerSave(editable,afterSave){if(!editable)return;$('#saveCustomer')?.addEventListener('click',()=>{const c=customers[selectedCustomerIndex];c.name=$('#detailName').value;c.cat=$('#detailHealthCategory')?.value||$('#detailCat').value;c.zone=$('#detailZone').value;c.area=$('#detailArea').value;c.plan=$('#detailPlan').value;c.address=$('#detailAddress').value;c.deliveryTime=$('#detailDeliveryTime').value;c.deliveryWindow=$('#detailDeliveryWindow').value;c.notes=$('#detailNotes').value;c.deliveryNote=$('#detailDeliveryNote')?.value||'';c.differentChoices=parseDifferentChoiceText($('#detailDifferentChoices')?.value||'',c);c.mealPackageId=$('#detailMealPackage').value;c.includeFriday=$('#detailIncludeFriday')?.checked||false;c.subscriptionStart=$('#detailSubscriptionStart')?.value||c.subscriptionStart;c.deliveryDays=Number($('#detailDeliveryDays')?.value||packageDeliveryTotal(c));c.subscriptionType=$('input[name="detailSubscriptionType"]:checked')?.value||'Standard';c.excludedDays=$$('.detailExcludedDay:checked').map(x=>x.value);c.selectedDeliveryDays=allWeekDays().filter(day=>!c.excludedDays.includes(day));c.includeFriday=c.selectedDeliveryDays.includes('Friday');c.subscriptionEnd=packageProgress(c).completionDate||c.subscriptionEnd;c.status=$('#detailStatus')?.value||c.status;c.pauseStartDate=$('#detailPauseStartDate')?.value||c.pauseStartDate||'';c.resumeDate=$('#detailResumeDate')?.value||c.resumeDate||'';c.receivedDeliveries=Number($('#detailReceivedDeliveries')?.value||c.receivedDeliveries||0);c.health=c.health||{};const calories=Number($('#detailCalories')?.value||0);if(calories)c.health.calories=calories;if($('#detailCat'))$('#detailCat').value=c.cat;c.weeks=collectWeekSelections();saveCustomerAdjustments(c);saveCustomerState(c);if(typeof afterSave==='function'){afterSave(c);return}$('#customerResults').innerHTML=customerRows(customers);bindCustomerButtons(editable);toast('Customer saved and assigned to '+customerDriver(c))})}
function customerForm(c,edit){const dis=edit?'':'disabled';const area=c.area||qatarZones[c.zone]?.[0]||'';return '<div class="form"><label><span>Name</span><input id="detailName" '+dis+' value="'+c.name+'"></label><label><span>Category</span><select id="detailCat" '+dis+'>'+mealCategories.map(x=>'<option '+(x[0]===c.cat?'selected':'')+'>'+x[0]+'</option>').join('')+'</select></label><label><span>Zone</span><select id="detailZone" '+dis+'>'+zoneOptions(c.zone)+'</select></label><label><span>Area Name</span><select id="detailArea" '+dis+'>'+areaOptions(c.zone,area)+'</select></label><label><span>Package</span><input id="detailPlan" '+dis+' value="'+c.plan+'"></label><label><span>Status</span><select id="detailStatus" '+dis+'><option '+((c.status||'Active')==='Active'?'selected':'')+'>Active</option><option '+((c.status||'Active')==='Paused'?'selected':'')+'>Paused</option><option '+((c.status||'Active')==='Custom'?'selected':'')+'>Custom</option></select></label><label><span>Received Deliveries</span><input id="detailReceivedDeliveries" type="number" min="0" '+dis+' value="'+deliveredCount(c)+'"></label><label><span>Address / Building</span><input id="detailAddress" '+dis+' value="'+c.address+'"></label><label><span>Meal Package</span><select id="detailMealPackage" '+dis+'>'+mealSelectionPackages.map(p=>'<option value="'+p.id+'" '+((c.mealPackageId||'3m1s')===p.id?'selected':'')+'>'+p.label+'</option>').join('')+'</select></label><label class="inline-check"><span>Friday Delivery</span><input id="detailIncludeFriday" type="checkbox" '+(customerHasFriday(c)?'checked':'')+' '+dis+'><b>Include Friday for this customer</b></label><label><span>Google Location</span><a class="map-link big" target="_blank" href="'+customerMapLink(c)+'">Open Customer Location</a></label><label><span>Assigned Driver</span><input id="detailDriver" disabled value="'+customerDriver(c)+'"></label><label><span>Preferred Delivery Time</span><input id="detailDeliveryTime" '+dis+' value="'+(c.deliveryTime||'08:00 AM')+'"></label><label><span>Delivery Window</span><input id="detailDeliveryWindow" '+dis+' value="'+(c.deliveryWindow||'08:00 - 08:30')+'"></label><label><span>Kitchen Notes</span><textarea id="detailNotes" '+dis+' rows="4">'+(c.notes||'')+'</textarea></label><label><span>Delivery Note</span><textarea id="detailDeliveryNote" '+dis+' rows="4">'+(c.deliveryNote||'')+'</textarea></label><label class="span-2 different-choice-field"><span>Different Choice Dishes</span><textarea id="detailDifferentChoices" '+dis+' rows="4" placeholder="One per line: Dish | Category">'+differentChoiceText(c)+'</textarea><small>Only outside-menu dishes typed by Boss/Admin. Example: Plain grilled chicken with rice | C</small></label><div class="admin-pause-date-row"><label><span>Pause From Date</span><input id="detailPauseStartDate" type="date" '+dis+' value="'+(c.pauseStartDate||'')+'"></label><label><span>Resume Date</span><input id="detailResumeDate" type="date" '+dis+' value="'+(c.resumeDate||'')+'"></label></div><div class="admin-pause-actions"><button type="button" class="primary-btn light" id="directPauseCustomer" '+dis+'>Pause Customer</button><button type="button" class="primary-btn green" id="directResumeCustomer" '+dis+'>Resume Customer</button></div>'+subscriptionCycleAdminHtml(c,edit)+customerBmiReportHtml(c,selectedCustomerIndex,edit)+adjustmentManagerHtml(c,edit)+weekPlannerHtml(c,edit)+'<button class="primary-btn wide" id="saveCustomer" '+dis+'>Save Customer Details</button></div>'}
function renderMealPlans(){state.module='mealplans';const editable=canEdit();moduleFrame('Meal Plans','',kpis([['Categories','6'],['Menu Days','6 + Friday'],['Breakfast/Snack','Standard'],['Lunch/Dinner','Category Based']])+'<div class="two-col"><section class="panel"><div class="panel-header"><h2>Meal Categories</h2><span class="sub">Exact category rules</span></div>'+table(['Category','Protein','Carbs','Notes'],mealCategories.map((c,i)=>[badge(c[0],i),c[1]+'g',c[2]+'g',c[3]]))+'</section><section class="panel"><div class="panel-header"><h2>Category Calculator</h2></div><div class="form"><label><span>Category</span><select id="calcCat">'+mealCategories.map(c=>'<option>'+c[0]+'</option>').join('')+'</select></label><label><span>Total Meals</span><input id="calcMeals" type="number" value="25"></label><button class="primary-btn" id="calcBtn">Calculate Kitchen Quantity</button></div><div id="calcOut" class="card" style="margin-top:10px"></div></section></div><section class="panel" style="margin-top:14px"><div class="panel-header"><div><h2>Current Confirmed Menu</h2><span class="sub">Boss/Admin can change any dish here. Customers and kitchen will use the updated names.</span></div></div>'+weeklyMenuHtml()+'</section><section class="panel" style="margin-top:14px"><div class="panel-header"><div><h2>Edit Current Menu</h2><span class="sub">Change Breakfast, Lunch, Dinner and Snack options for each day.</span></div></div>'+menuEditorHtml(editable)+'</section>');$('#calcBtn').addEventListener('click',calcCategory);calcCategory();bindMenuEditor()}
function calcCategory(){const cat=$('#calcCat').value;const meals=Number($('#calcMeals').value||0);const row=mealCategories.find(c=>c[0]===cat);$('#calcOut').innerHTML='<strong>Category '+cat+'</strong><span>Current category guide: '+row[1]+'g protein - '+row[2]+'g carbs</span><span>For exact menu nutrition, enter calories/protein/carbs/fat inside each lunch and dinner option row.</span><span>For '+meals+' meals guide total: '+((row[1]*meals)/1000).toFixed(2)+' kg protein - '+((row[2]*meals)/1000).toFixed(2)+' kg carbs</span>'}
function renderSubscriptions(){state.module='subscriptions';const editable=canEdit();const custom='<article class="card package-card"><strong>Custom Package</strong><span>Choose price, calendar days, delivery days, meals and notes manually.</span><div class="form" style="margin-top:10px"><input placeholder="Custom price QTR"><input placeholder="Calendar days"><input placeholder="Delivery days"><input placeholder="Package notes"><button class="primary-btn">Save Custom</button></div></article>';moduleFrame('Subscriptions','',kpis([['Packages','6 + Custom'],['Weekly Rule','7 days / 6 deliveries'],['Monthly Rule','30 days / 24 deliveries'],['Friday','Excluded']])+'<section class="panel"><div class="panel-header"><h2>Subscription Rules</h2><span class="sub">Calendar days and delivery days are separate.</span></div>'+table(['Package Type','Calendar Days','Delivery Days','Friday','Meaning'],subscriptionRules.map(r=>[r.name,r.calendarDays,r.deliveryDays,r.friday?'Included':'Excluded',r.note]))+'</section>'+subscriptionCycleDemoHtml()+'<section class="panel" style="margin-top:14px"><div class="panel-header"><h2>Subscription Packages</h2><span class="sub">QTR package list. Monthly packages are 30 calendar days with 24 deliveries excluding Fridays.</span></div><div class="cards">'+packages.map(p=>'<article class="card package-card"><strong>'+escHtml(p.name)+'</strong><span>'+money(p.price)+' - '+p.meals+' meals - '+p.calendarDays+' calendar days - '+p.deliveryDays+' deliveries</span><small>'+(p.friday?'Friday included':'Friday excluded unless a special Friday option is added')+'</small><button class="primary-btn light" style="margin-top:10px">Assign Package</button></article>').join('')+custom+'</div></section><section class="panel" style="margin-top:14px"><div class="panel-header"><h2>Edit Subscription Packages</h2><span class="sub">Boss/Admin can change amount, meals and delivery counts here.</span></div>'+packageEditorHtml(editable)+'</section>');bindPackageEditor()}
function renderDrivers(){state.module='drivers';moduleFrame('Drivers','',kpis([['Drivers','6'],['Live Tracking','Active'],['Route Order','Time Based'],['Zones','6']])+'<div class="two-col"><section class="panel"><div class="panel-header"><h2>Drivers By Qatar Zone</h2><span class="sub">Each driver has fixed zone, phone and timing.</span></div>'+table(['Driver','Phone','Zone','Locations','Start','End','Status'],drivers.map((d,i)=>[d[0],driverPhones[d[0]],badge(zoneShort(d[1]),i),d[2],d[3],d[4],pill(d[5])]))+'</section><section class="panel"><div class="panel-header"><h2>Live Driver Status</h2><span class="sub">Current place and next customer</span></div>'+liveTrackingTable()+'</section></div><section class="panel" style="margin-top:14px"><div class="panel-header"><div><h2>Live Tracking</h2><span class="sub">Google Map shows the selected Qatar driver area. GPS will connect later with driver mobile app.</span></div></div>'+liveMap()+liveTrackingCards()+'<div id="trackText" class="card live-track-detail" style="margin-top:10px"><strong>Live status</strong><span>Select a driver to show live route.</span></div></section>');bindLiveTracking()}
function liveMap(){const s=liveDriverStatuses();const active=s[0];const pos=[[18,23],[58,16],[38,48],[64,57],[28,70],[74,34]];return '<div class="driver-map live-qatar-map"><iframe id="liveGoogleMap" class="map-iframe" title="Live Google Map Qatar" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="'+googleMapEmbed(active.area,active.current?.address||active.area)+'"></iframe><div class="map-shade"></div><div class="google-map-caption floating"><div><strong id="liveMapTitle">'+active.driver+'</strong><span id="liveMapSub">'+active.area+' - '+zoneShort(active.zone)+'</span></div><a id="liveMapOpen" class="map-link" target="_blank" href="'+active.google+'">Open Full Google Map</a></div><span class="map-label" style="left:14%;top:13%">West Bay</span><span class="map-label" style="left:55%;top:8%">Lusail</span><span class="map-label" style="left:33%;top:39%">Al Sadd</span><span class="map-label" style="left:61%;top:70%">Al Wakrah</span>'+s.map((x,i)=>'<button class="pin p'+(i+1)+'" style="left:'+pos[i][0]+'%;top:'+pos[i][1]+'%" data-driver="'+x.driver+'" onclick="showLiveDriver(this.dataset.driver)" data-zone="'+zoneShort(x.zone)+'" data-area="'+x.area+'" title="'+x.driver+' - '+x.area+'">'+(i+1)+'</button>').join('')+'</div>'}
function driverOptionsHtml(selected){return drivers.map(d=>'<option value="'+escAttr(d[0])+'" '+(selected===d[0]?'selected':'')+'>'+escHtml(d[0])+'</option>').join('')}
function driverAssignmentHtml(){if(!canManageDrivers())return '';const first=customers[0]||{};const rows=customers.map((c,i)=>[escHtml(c.name),zoneShort(c.zone),escHtml(c.area||'-'),escHtml(c.deliveryTime||'-'),escHtml(assignedDriver(c.zone)),customerDriver(c)===assignedDriver(c.zone)?'<span class="assignment-auto">Auto</span>':'<span class="assignment-manual">Edited</span>','<select class="driver-assign-select" data-customer-index="'+i+'">'+driverOptionsHtml(customerDriver(c))+'</select>']);return '<section class="panel driver-assignment-panel" style="margin-top:14px"><div class="panel-header"><div><h2>Customer Driver Assignment</h2><span class="sub">Select customer, check automatic zone details, then edit assigned driver when needed.</span></div><button type="button" class="primary-btn green" id="saveDriverAssignments">Save All Driver Changes</button></div><div class="driver-assignment-card"><div><h3>Assignment Information</h3><p><b>Automatic driver:</b> customers are assigned from their zone first. CEO, Admin and Transportation Manager can change the driver here.</p></div><div class="driver-assignment-form"><label class="span-wide"><span>Customer Name</span><input id="assignCustomerName" list="driverAssignmentCustomers" value="'+escAttr(first.name||'')+'" placeholder="Search customer name"></label><label><span>Zone</span><input id="assignZone" disabled></label><label><span>Area</span><input id="assignArea" disabled></label><label><span>Delivery Time</span><input id="assignTime" disabled></label><label><span>Auto Driver</span><input id="assignAutoDriver" disabled></label><label><span>Assigned Driver</span><select id="assignDriver">'+driverOptionsHtml(first.name?customerDriver(first):drivers[0][0])+'</select></label></div><div class="driver-assignment-actions"><button type="button" class="primary-btn green" id="applyDriverAssignment">Apply Driver</button><button type="button" class="primary-btn light" id="resetDriverAssignment">Reset To Auto Driver</button></div></div><datalist id="driverAssignmentCustomers">'+customers.map(c=>'<option value="'+escAttr(c.name)+'"></option>').join('')+'</datalist><h3 class="assignment-list-title">Current Driver Assignments</h3>'+table(['Customer','Zone','Area','Time','Auto Driver','Status','Assigned Driver'],rows)+'</section>'}
function bindDriverAssignments(){if(!canManageDrivers())return;const findCustomer=()=>{const name=($('#assignCustomerName')?.value||'').trim().toLowerCase();return customers.find(c=>String(c.name).toLowerCase()===name)};const fillAssignment=()=>{const c=findCustomer()||customers[0];if(!c)return;$('#assignCustomerName').value=c.name;$('#assignZone').value=zoneShort(c.zone);$('#assignArea').value=c.area||'-';$('#assignTime').value=c.deliveryTime||'-';$('#assignAutoDriver').value=assignedDriver(c.zone);$('#assignDriver').value=customerDriver(c)};$('#assignCustomerName')?.addEventListener('input',fillAssignment);$('#assignCustomerName')?.addEventListener('change',fillAssignment);$('#applyDriverAssignment')?.addEventListener('click',()=>{const c=findCustomer();if(!c){toast('Select a customer first');return}c.driverOverride=$('#assignDriver').value;saveCustomerState(c);toast('Driver updated for '+c.name);renderDelivery()});$('#resetDriverAssignment')?.addEventListener('click',()=>{const c=findCustomer();if(!c){toast('Select a customer first');return}c.driverOverride='';saveCustomerState(c);toast(c.name+' reset to automatic zone driver');renderDelivery()});$('#saveDriverAssignments')?.addEventListener('click',()=>{document.querySelectorAll('.driver-assign-select').forEach(select=>{const c=customers[Number(select.dataset.customerIndex)];if(c){c.driverOverride=select.value===assignedDriver(c.zone)?'':select.value;saveCustomerState(c)}});toast('Driver assignments saved');renderDelivery()});fillAssignment()}
function renderDelivery(){state.module='delivery';moduleFrame('Delivery','',kpis([['Delivery Zones','6'],['Route Order','By Time'],['To Deliver','224'],['Live Drivers','6']])+'<div class="two-col"><section class="panel"><div class="panel-header"><div><h2>Driver Route Order</h2><span class="sub">Stops are sorted from first delivery time to last delivery time.</span></div></div><div class="form two" style="margin-bottom:12px"><label><span>Driver</span><select id="routeDriverSelect">'+drivers.map(d=>'<option>'+d[0]+'</option>').join('')+'</select></label><label><span>Assigned Zone</span><input id="routeDriverZone" disabled></label></div><div id="routeOrderBox"></div></section><section class="panel"><div class="panel-header"><h2>Customer Locations</h2><span class="sub">Time window supports customer and driver</span></div>'+table(['Customer','Time','Window','Zone','Area','Driver','Google'],customers.map(c=>[c.name,c.deliveryTime||'-',c.deliveryWindow||'-',zoneShort(c.zone),c.area||'-',customerDriver(c),'<a class="map-link" target="_blank" href="'+customerMapLink(c)+'">Open Map</a>']))+'</section></div>'+driverAssignmentHtml());const renderRoute=()=>{const driver=$('#routeDriverSelect').value;const d=drivers.find(x=>x[0]===driver);$('#routeDriverZone').value=d?d[1]:'';const rows=routeRowsForDriver(driver);$('#routeOrderBox').innerHTML=rows.length?table(['Stop','Time','Window','Customer','Zone','Area','Address','Map'],rows):'<div class="locked-panel">No customers assigned to this driver yet.</div>'};$('#routeDriverSelect').addEventListener('change',renderRoute);renderRoute();bindDriverAssignments()}

function refreshWeekPlannerForPackage(){const c=customers[selectedCustomerIndex]||{};const preview={...c,mealPackageId:$('#detailMealPackage')?.value||c.mealPackageId||'3m1s',includeFriday:$('#detailIncludeFriday')?.checked||false,weeks:collectWeekSelections().length?collectWeekSelections():(c.weeks||defaultWeekSelections())};const planner=$('.week-planner');if(planner){planner.outerHTML=weekPlannerHtml(preview,canEdit());bindWeekPackageActions();$('#detailIncludeFriday')?.addEventListener('change',refreshWeekPlannerForPackage)}}
function kitchenOptionCountHtml(){const counts={};const add=(label,type,opt,customer)=>{if(!opt)return;const arr=Array.isArray(opt)?opt:[opt];arr.forEach(n=>{const key=label+'|'+type+'|'+n;if(!counts[key])counts[key]={day:label,type,option:n,item:selectedOptionLabel(type,n,label==='Friday'?'Thursday':'Saturday'),customers:[]};counts[key].customers.push(customer.name+' ('+customer.cat+')')})};customers.forEach(c=>(c.weeks||[]).forEach(w=>{Object.entries(w.menuOptions||{}).forEach(([type,opt])=>add('Regular days',type,opt,c));if(customerHasFriday(c)){Object.entries(w.fridayOptions||{}).forEach(([type,opt])=>add('Friday',type,opt,c))}}));const rows=Object.values(counts).map(r=>[r.day,r.type,'Option '+r.option,r.item,r.customers.length,r.customers.join(', ')]);return rows.length?table(['Day','Meal','Option','Menu Item','Total','Customers'],rows):'<div class="locked-panel">No menu choices saved yet.</div>'}
function weeklySelectionHtml(){const rows=[];customers.forEach(c=>(c.weeks||[]).forEach(w=>{const regular=Object.entries(w.menuOptions||{}).map(([type,opt])=>type+': '+formatSelectedOptions(type,opt)).join(' | ');rows.push([c.name,c.cat,'Week '+w.week,'Regular days',regular||'-',c.notes||'-']);if(customerHasFriday(c)){const friday=Object.entries(w.fridayOptions||{}).map(([type,opt])=>type+': '+formatSelectedOptions(type,opt)).join(' | ');rows.push([c.name,c.cat,'Week '+w.week,'Friday only',friday||'No Friday choices selected yet',c.notes||'-'])}}));return table(['Customer','Category','Week','Day Type','Selection','Kitchen Notes'],rows)}

function kitchenCommentsHtml(){const common=[['No spicy',['no spicy','not spicy','spicy']],['No lactose',['no lactose','lactose']],['No tomato',['no tomato','no tomatoes','tomato']],['No nuts',['no nuts','nuts']],['No seafood',['no seafood','seafood']],['Low salt',['low salt','salt']],['No yogurt',['no yogurt','without yogurt','yogurt']],['Extra protein',['extra protein']]];const rows=[];common.forEach(([label,keys])=>{const matched=customers.filter(c=>keys.some(k=>(c.notes||'').toLowerCase().includes(k)));if(matched.length)rows.push([label,matched.length,matched.map(c=>c.name+' ('+c.cat+')').join(', '),matched.map(c=>c.notes).join(' | ')])});return rows.length?table(['Common Comment','Customers','Customer Names','Kitchen Notes'],rows):'<div class="locked-panel">No common comments found yet.</div>'}

function categorySelectHtml(value,cls='',attrs=''){const selected=String(value||'A');return '<select class="'+cls+'" '+attrs+'>'+mealCategories.map(c=>'<option value="'+c[0]+'" '+(c[0]===selected?'selected':'')+'>'+c[0]+' - '+c[1]+'P/'+c[2]+'C</option>').join('')+'</select>'}
function kitchenDifferentChoiceHtml(editable){const reportRows=customers.flatMap(c=>customerDifferentChoices(c).map(choice=>[escHtml(choice.dish),escHtml(differentChoiceMacro(choice,c)),escHtml(c.name)]));const report=reportRows.length?table(['Dish / Different Choice','Macro','Customer Name'],reportRows):'<div class="locked-panel">No different choice dishes added yet.</div>';if(!editable)return '<div class="different-choice-kitchen-report">'+report+'</div>';const datalist='<datalist id="kitchenCustomerNames">'+customers.map(c=>'<option value="'+escAttr(c.name)+'"></option>').join('')+'</datalist>';const addForm='<div class="different-choice-add-form"><label><span>Customer Name</span><input id="differentChoiceCustomer" list="kitchenCustomerNames" placeholder="Type or select customer name"></label><label><span>Category</span>'+categorySelectHtml('A','', 'id="differentChoiceCategory"')+'</label><label class="different-choice-dish-field"><span>Dish / Different Choice</span><input id="differentChoiceDish" placeholder="Example: Plain grilled chicken with rice"></label><button type="button" class="primary-btn green" id="addDifferentChoice">Add Choice</button></div>';const editRows=[];customers.forEach((c,customerIndex)=>customerDifferentChoices(c).forEach((choice,choiceIndex)=>editRows.push(['<input class="different-choice-customer-name" data-customer-index="'+customerIndex+'" value="'+escAttr(c.name)+'" disabled>',categorySelectHtml(choice.cat||c.cat,'different-choice-category','data-customer-index="'+customerIndex+'" data-choice-index="'+choiceIndex+'"'),'<input class="different-choice-dish-input" data-customer-index="'+customerIndex+'" data-choice-index="'+choiceIndex+'" value="'+escAttr(choice.dish)+'">','<button type="button" class="primary-btn danger remove-different-choice" data-customer-index="'+customerIndex+'" data-choice-index="'+choiceIndex+'">Remove</button>'])));const editTable=editRows.length?table(['Customer','Category','Dish / Different Choice','Action'],editRows):'<div class="locked-panel">No different choice rows yet. Add one above.</div>';return '<div class="different-choice-kitchen-report"><div class="panel-header different-choice-edit-head"><div><h3>CEO/Admin Edit</h3><span class="sub">Select customer, category fills automatically, then type the outside-menu dish.</span></div><button type="button" class="primary-btn green no-print" id="saveKitchenDifferentChoices">Save Different Choices</button></div>'+datalist+addForm+editTable+'</div>'}
function bindKitchenDifferentChoices(editable){if(!editable)return;const customerInput=$('#differentChoiceCustomer');const categoryInput=$('#differentChoiceCategory');const matchCustomer=()=>customers.find(c=>String(c.name||'').trim().toLowerCase()===String(customerInput?.value||'').trim().toLowerCase());customerInput?.addEventListener('input',()=>{const c=matchCustomer();if(c&&categoryInput)categoryInput.value=c.cat||'A'});$('#addDifferentChoice')?.addEventListener('click',()=>{const c=matchCustomer();const dish=$('#differentChoiceDish')?.value.trim()||'';if(!c){toast('Please choose a valid customer name');return}if(!dish){toast('Please type the different choice dish');return}c.differentChoices=customerDifferentChoices(c);c.differentChoices.push({dish,cat:categoryInput?.value||c.cat||'A'});saveCustomerState(c);toast('Different choice added for '+c.name);renderKitchen($('#kitchenProductionDate')?.value)});document.querySelectorAll('.remove-different-choice').forEach(btn=>btn.addEventListener('click',()=>{const c=customers[Number(btn.dataset.customerIndex)];if(!c)return;c.differentChoices=customerDifferentChoices(c).filter((_,i)=>i!==Number(btn.dataset.choiceIndex));saveCustomerState(c);toast('Different choice removed');renderKitchen($('#kitchenProductionDate')?.value)}));$('#saveKitchenDifferentChoices')?.addEventListener('click',()=>{const next=customers.map(()=>[]);document.querySelectorAll('.different-choice-dish-input').forEach(input=>{const customerIndex=Number(input.dataset.customerIndex);const dish=input.value.trim();if(!dish)return;const cat=document.querySelector('.different-choice-category[data-customer-index="'+customerIndex+'"][data-choice-index="'+input.dataset.choiceIndex+'"]')?.value||customers[customerIndex]?.cat||'A';next[customerIndex].push({dish,cat})});customers.forEach((c,i)=>{c.differentChoices=next[i]||[];saveCustomerState(c)});toast('Different choice dishes saved for kitchen report');renderKitchen($('#kitchenProductionDate')?.value)})}
function enableKitchenReportEditing(){if(!canEdit())return;document.querySelectorAll('.daily-report-book td,.daily-report-book .production-note-card h3,.daily-report-book .production-note-line').forEach(el=>{el.contentEditable='true';el.classList.add('sheet-editable')});toast('CEO/Admin can click sheet text and edit before printing')}

function kitchenNutritionReportHtml(){const totals={};const add=(dayLabel,type,opt,c)=>{if(!opt)return;const arr=Array.isArray(opt)?opt:[opt];arr.forEach(n=>{const index=Number(n)-1;const cat=(type==='Lunch'||type==='Dinner')?c.cat:'Standard';const nutrition=calculatedNutrition(dayLabel==='Friday'?'Friday':'Saturday',type,index,c.cat);const key=dayLabel+'|'+type+'|'+n+'|'+cat;if(!totals[key])totals[key]={day:dayLabel,type,option:n,item:selectedOptionLabel(type,n,dayLabel==='Friday'?'Thursday':'Saturday'),cat,qty:0,calories:nutrition.calories,protein:nutrition.protein,carbs:nutrition.carbs,fat:nutrition.fat};totals[key].qty++})};customers.forEach(c=>(c.weeks||[]).forEach(w=>{Object.entries(w.menuOptions||{}).forEach(([type,opt])=>add('Regular days',type,opt,c));if(customerHasFriday(c)){Object.entries(w.fridayOptions||{}).forEach(([type,opt])=>add('Friday',type,opt,c))}}));const rows=Object.values(totals).map(r=>[r.day,r.type,'Option '+r.option,r.item,r.cat,r.qty,r.calories+' kcal',r.protein+'g',r.carbs+'g',r.fat+'g',(r.calories*r.qty)+' kcal',(r.protein*r.qty)+'g',(r.carbs*r.qty)+'g',(r.fat*r.qty)+'g']);return rows.length?table(['Day','Meal','Option','Dish','Category','Qty','Cal / Meal','P / Meal','C / Meal','F / Meal','Total Cal','Total P','Total C','Total F'],rows):'<div class="locked-panel">No nutrition selections saved yet.</div>'}

function packingMenuOptions(c,index){const week=(c.weeks||[])[0]||{};const opts=week.menuOptions||{};const pkg=packageById(c.mealPackageId||'3m1s');const fallback=((index%4)+1);const rows=[];pkg.meals.forEach(type=>{const picked=opts[type]||fallback;rows.push('<li><b>'+type+'</b><span>Option '+picked+' - '+escHtml(selectedOptionLabel(type,picked))+'</span></li>')});if(pkg.snacks){let selected=opts.Snacks;if(!Array.isArray(selected))selected=selected?[selected]:[];if(!selected.length)selected=Array.from({length:pkg.snacks},(_,i)=>((index+i)%4)+1);selected.slice(0,pkg.snacks).forEach((picked,i)=>rows.push('<li><b>'+(pkg.snacks>1?'Snack '+(i+1):'Snack')+'</b><span>Option '+picked+' - '+escHtml(selectedOptionLabel('Snacks',picked))+'</span></li>'))}return '<ul class="packing-menu-list">'+rows.join('')+'</ul>'}
function packingCard(c,index){return '<article class="packing-card"><div class="packing-card-head"><strong>'+escHtml(c.name)+'</strong>'+badge(c.cat,index)+'</div><div class="packing-meta"><span><b>Category</b>'+escHtml(c.cat)+'</span><span><b>Package</b>'+escHtml(packageById(c.mealPackageId||'3m1s').label)+'</span><span><b>Driver</b>'+escHtml(customerDriver(c))+'</span></div><div class="packing-menu"><b>Menu Options</b>'+packingMenuOptions(c,index)+'</div><div class="packing-note"><b>Note</b><span>'+escHtml(c.notes||'No notes')+'</span></div></article>'}
function packingSheetHtml(filter='All'){const cats=mealCategories.map(c=>c[0]);const list=customers.filter(c=>filter==='All'||c.cat===filter).slice().sort((a,b)=>a.cat.localeCompare(b.cat)||timeToMinutes(a.deliveryTime)-timeToMinutes(b.deliveryTime));const groups=(filter==='All'?cats:[filter]).map(cat=>{const group=list.filter(c=>c.cat===cat);return group.length?'<section class="packing-category"><h3>Category '+cat+' <span>'+group.length+' customer(s)</span></h3><div class="packing-sheet-grid">'+group.map((c,i)=>packingCard(c,i)).join('')+'</div></section>':''}).join('');return groups||'<div class="locked-panel">No customers in this category.</div>'}
function packingNoteSummaryHtml(){const keys=['no spicy','no lactose','no nuts','no tomato','no seafood','low salt'];const rows=keys.map(k=>{const names=customers.filter(c=>String(c.notes||'').toLowerCase().includes(k)).map(c=>c.name+' ('+c.cat+')');return [k.split(' ').map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' '),names.length,names.join(', ')||'-']});return table(['Common Note','Customers','Names'],rows)}
function printPackingSheet(){const active=state.packingCat||'All';const paper=$('.packing-paper')?.innerHTML||packingSheetHtml(active);const notes=packingNoteSummaryHtml();const title='Triangle Healthy Kitchen - Packing Sheet '+(active==='All'?'All Categories':'Category '+active);state.module='packing-print';$('#pageTitle').textContent='Packing Print Preview';$('#workspace').innerHTML='<section class="panel packing-print-page"><div class="print-preview-actions no-print"><button class="primary-btn light" id="backPacking">Back to Packing</button><button class="primary-btn green" id="printNowPacking">Print Now</button></div><div class="print-head"><div><h1>Triangle Healthy Kitchen Packing Sheet</h1><span>'+title+'</span></div><span>'+new Date().toLocaleString()+'</span></div><div class="packing-paper">'+paper+'</div><h2 class="packing-summary-title">Common Notes</h2>'+notes+'</section>';$('#backPacking')?.addEventListener('click',()=>renderPacking());$('#printNowPacking')?.addEventListener('click',()=>window.print());toast('Packing sheet opened. Click Print Now when ready.')}
globalThis.printPackingSheet=printPackingSheet
function renderPacking(){state.module='packing';const active=state.packingCat||'All';const counts=mealCategories.map(c=>customers.filter(x=>x.cat===c[0]).length);moduleFrame('Packing','',kpis([['Customers',customers.length],['Categories',mealCategories.length],['Special Notes',customers.filter(c=>(c.notes||'').trim()).length],['Print Sheet','Ready']])+'<section class="panel print-report packing-report"><div class="panel-header"><div><h2>Packing Sheet</h2><span class="sub">Customer name, category, package, menu options, note and driver only.</span></div><button class="primary-btn green no-print" id="printPacking">Open Packing Sheet</button></div><div class="packing-filter no-print"><button class="'+(active==='All'?'active':'')+'" data-pack-cat="All">All</button>'+mealCategories.map((c,i)=>'<button class="'+(active===c[0]?'active':'')+'" data-pack-cat="'+c[0]+'">'+c[0]+' <span>'+counts[i]+'</span></button>').join('')+'</div><div class="packing-paper">'+packingSheetHtml(active)+'</div><h3 class="packing-summary-title">Common Notes For Packing</h3>'+packingNoteSummaryHtml()+'</section>');$('#printPacking')?.addEventListener('click',()=>printPackingSheet());$$('[data-pack-cat]').forEach(btn=>btn.addEventListener('click',()=>{state.packingCat=btn.dataset.packCat;renderPacking()}))}
function renderKitchen(date){state.module='kitchen';const editable=canEdit();const reportDate=validDateValue(date)?date:new Date().toISOString().slice(0,10);const rows=productionRowsForDate(reportDate);moduleFrame('Kitchen','',kpis([['Production Day',dayNameFromDate(reportDate)],['Quantity Sheet','Ready'],['Portion Sheet','Lunch + Dinner'],['Kitchen Notes','Ready']])+'<section class="panel daily-production-module kitchen-production-page"><div class="panel-header no-print"><div><h2>Kitchen Production Reports</h2><span class="sub">Daily printable sheets for kitchen production and packing preparation.</span></div><button class="primary-btn green" id="printKitchen">Print Kitchen Reports</button></div><div class="daily-report-controls no-print"><label><span>Production Date</span><input type="date" id="kitchenProductionDate" value="'+reportDate+'"></label><button class="primary-btn green" id="generateKitchenReports">Generate Reports</button></div><div class="three-col meal-rule-cards no-print"><article class="card"><strong>Quantity Sheet</strong><span>Breakfast, lunch, dinner and snack totals.</span><b>All meal types</b></article><article class="card"><strong>Portion Count Sheet</strong><span>Only lunch and dinner by A-F macro category.</span><b>Lunch + Dinner</b></article><article class="card"><strong>Kitchen Notes Sheets</strong><span>Breakfast/snack and lunch/dinner separated.</span><b>Fast reading</b></article></div>'+(editable?'<div class="no-print kitchen-edit-panel">'+kitchenDifferentChoiceHtml(true)+'</div><div class="no-print report-edit-hint"><strong>CEO/Admin report edit:</strong> click any quantity, portion count, meal name, or note text inside the sheets below and edit before printing.</div>':'')+'<div class="daily-report-book print-report">'+quantitySheetHtml(rows,reportDate)+portionSheetHtml(rows,reportDate)+notesSheetHtml(rows,reportDate)+differentChoiceSheetHtml(reportDate)+'</div></section>');$('#printKitchen').addEventListener('click',()=>window.print());$('#generateKitchenReports')?.addEventListener('click',()=>renderKitchen($('#kitchenProductionDate').value));bindKitchenDifferentChoices(editable);enableKitchenReportEditing()}
function trialActionsHtml(c,i){const status=trialStatusText(c);const buttons=[];if(status==='Trial Day')buttons.push('<button class="primary-btn light trial-complete" data-customer-index="'+i+'">Mark Trial Completed</button>');if(status==='Trial Completed'){buttons.push('<button class="primary-btn green trial-await-payment" data-customer-index="'+i+'">Customer Pays Now</button>');buttons.push('<button class="primary-btn light trial-without-payment" data-customer-index="'+i+'">Start Without Payment</button>');buttons.push('<button class="primary-btn danger trial-stop" data-customer-index="'+i+'">Stop</button>')}return buttons.join('')}
function paymentAdminRows(){return customers.flatMap((c,i)=>{const p=ensurePaymentRecord(c);const trialButtons=trialActionsHtml(c,i);const actions=[trialButtons,'<button class="primary-btn green approve-payment" data-customer-index="'+i+'">Approve Payment</button>'].filter(Boolean);if(/cash/i.test(p.method||''))actions.unshift('<button class="primary-btn light mark-cash-received" data-customer-index="'+i+'">Cash Received</button>');actions.push('<button class="primary-btn light view-payment-customer" data-customer-index="'+i+'">View Customer</button>');const rows=[[escHtml(c.name),escHtml(c.phone||'-'),'Current / Trial',escHtml(c.plan||packagePlanName(c.mealPackageId)),money(paymentAmount(c)),escHtml(p.method||'-'),pill(p.status)+'<br><small>'+escHtml(trialStatusText(c))+'</small>',paymentProofPreview(p)+trialTimelineHtml(c),'<input class="payment-date-input" type="date" data-customer-index="'+i+'" value="'+escAttr(p.expectedDate||'')+'">',escHtml(p.approvedBy||'-'),'<div class="action-pair payment-actions">'+actions.join('')+'</div>']];const r=ensureRenewalRequest(c);if(r){const renewalActions=['<button class="primary-btn green approve-renewal" data-customer-index="'+i+'">Approve Renewal</button>'];if(/cash/i.test(r.method||''))renewalActions.unshift('<button class="primary-btn light approve-renewal" data-customer-index="'+i+'">Cash Received</button>');renewalActions.push('<button class="primary-btn light view-payment-customer" data-customer-index="'+i+'">View Customer</button>');rows.push([escHtml(c.name),escHtml(c.phone||'-'),'Renewal Request',escHtml(r.packageLabel||packageById(r.mealPackageId).label),money(r.amount||0),escHtml(r.method||'-'),pill(r.status),paymentProofPreview(r),escHtml(r.created||'-'),escHtml(r.approvedBy||'-'),'<div class="action-pair payment-actions">'+renewalActions.join('')+'</div>'])}return rows})}
function bindPaymentAdminActions(){if(!canEdit())return;document.querySelectorAll('.trial-complete').forEach(btn=>btn.addEventListener('click',()=>{const c=customers[Number(btn.dataset.customerIndex)];if(!c)return;setTrialStatus(c,'Trial Completed','Trial delivery completed. Waiting for next decision.');toast(c.name+' moved to Trial Completed');renderPayments()}));document.querySelectorAll('.trial-await-payment').forEach(btn=>btn.addEventListener('click',()=>{const c=customers[Number(btn.dataset.customerIndex)];if(!c)return;setTrialStatus(c,'Awaiting Payment','Customer wants to continue. Waiting for payment proof/cash.');toast(c.name+' is now awaiting payment');renderPayments()}));document.querySelectorAll('.trial-without-payment').forEach(btn=>btn.addEventListener('click',()=>{const c=customers[Number(btn.dataset.customerIndex)];if(!c)return;const p=ensurePaymentRecord(c);p.method='Started Without Payment';p.note='CEO/Admin started subscription after trial without payment.';setTrialStatus(c,'Active - Payment Pending','CEO/Admin started subscription without payment. Payment remains pending.');toast(c.name+' started without payment. Payment pending stays visible.');renderPayments()}));document.querySelectorAll('.trial-stop').forEach(btn=>btn.addEventListener('click',()=>{const c=customers[Number(btn.dataset.customerIndex)];if(!c)return;setTrialStatus(c,'Stopped','Trial stopped. No subscription started.');toast(c.name+' stopped after trial');renderPayments()}));document.querySelectorAll('.approve-payment,.mark-cash-received').forEach(btn=>btn.addEventListener('click',()=>{const c=customers[Number(btn.dataset.customerIndex)];if(!c)return;const p=ensurePaymentRecord(c);const dateInput=document.querySelector('.payment-date-input[data-customer-index="'+btn.dataset.customerIndex+'"]');setCustomerPayment(c,'Paid',{method:p.method||'Manual Payment',expectedDate:dateInput?.value||p.expectedDate,approvedBy:roles[state.role]?.label||'CEO/Admin',approvedDate:new Date().toISOString().slice(0,10),note:btn.classList.contains('mark-cash-received')?'Cash received and approved':'Payment proof approved'});c.trialStatus='Active';addTrialEvent(c,'Payment approved. Subscription active.');saveCustomerState(c);toast(c.name+' payment approved. Customer is now Active / Paid.');renderPayments()}));document.querySelectorAll('.approve-renewal').forEach(btn=>btn.addEventListener('click',()=>{const c=customers[Number(btn.dataset.customerIndex)];const r=ensureRenewalRequest(c);if(!c||!r)return;const pkg=packageById(r.mealPackageId||c.mealPackageId||'3m1s');c.mealPackageId=pkg.id;c.plan=packagePlanName(pkg.id);c.deliveryDays=24;const renewalDays=Array.isArray(r.selectedDeliveryDays)&&r.selectedDeliveryDays.length?r.selectedDeliveryDays:null;if(renewalDays){c.selectedDeliveryDays=renewalDays;c.excludedDays=Array.isArray(r.excludedDays)?r.excludedDays:allWeekDays().filter(day=>!renewalDays.includes(day));c.includeFriday=renewalDays.includes('Friday')}c.receivedDeliveries=0;c.subscriptionStart=new Date().toISOString().slice(0,10);c.subscriptionEnd=packageProgress(c).completionDate||c.subscriptionEnd;c.payment={status:'Paid',method:r.method||'Renewal Payment',expectedDate:c.subscriptionStart,proofName:r.proofName||'',proofData:r.proofData||'',uploadedDate:r.created||'',approvedBy:roles[state.role]?.label||'CEO/Admin',approvedDate:new Date().toISOString().slice(0,10),note:'Renewal approved'};c.paymentStatus='Paid';c.renewalRequest={...r,status:'Renewal Approved',approvedBy:roles[state.role]?.label||'CEO/Admin',approvedDate:new Date().toISOString().slice(0,10)};saveCustomerState(c);toast(c.name+' renewal approved and package restarted.');renderPayments()}));document.querySelectorAll('.view-payment-customer').forEach(btn=>btn.addEventListener('click',()=>{selectedCustomerIndex=Number(btn.dataset.customerIndex)||0;openModule('customers');setTimeout(()=>$('#customerDetailsSection')?.scrollIntoView({behavior:'smooth',block:'start'}),80)}));document.querySelectorAll('.payment-date-input').forEach(input=>input.addEventListener('change',()=>{const c=customers[Number(input.dataset.customerIndex)];if(!c)return;const p=ensurePaymentRecord(c);p.expectedDate=input.value;saveCustomerState(c);toast('Expected payment date updated for '+c.name)}));document.querySelectorAll('.payment-proof-thumb').forEach(btn=>btn.addEventListener('click',()=>openPaymentProofModal(btn.dataset.proofName,btn.dataset.proofData)))}
function renderPayments(){state.module='payments';const paid=customers.filter(c=>/paid/i.test(paymentStatusText(c))).length;const proof=customers.filter(c=>/proof uploaded/i.test(paymentStatusText(c))).length;const trialToday=customers.filter(c=>trialStatusText(c)==='Trial Day').length;const trialDone=customers.filter(c=>trialStatusText(c)==='Trial Completed').length;const renewals=customers.filter(c=>ensureRenewalRequest(c)&&!/approved/i.test(renewalStatusText(c))).length;moduleFrame('Payments','',kpis([['Trial Today',trialToday],['Trial Completed',trialDone],['Paid / Active',paid],['Renewal Requests',renewals]])+'<section class="panel payment-admin-panel"><div class="panel-header"><div><h2>Trial + Payment Control</h2><span class="sub">Manual proof/cash approval until card gateway is connected.</span></div></div>'+table(['Customer','Phone','Type','Package','Amount','Method','Status','Payment Proof / Timeline','Expected / Requested','Approved By','Action'],paymentAdminRows())+'</section>');bindPaymentAdminActions()}
function renderReminders(){state.module='reminders';moduleFrame('Reminders','',kpis([['Sent Today','58'],['Renewals','21'],['Payments','9'],['Delivery Alerts','6']])+'<section class="panel">'+table(['Customer','Reminder','Channel','Status'],[['Sara Al Kuwari','Package expires in 2 days','WhatsApp',pill('Ready')],['Ahmed Mansoor','Payment pending','WhatsApp',pill('Ready')],['Mariam Al Naimi','Welcome message','Instagram',pill('Ready')]])+'</section>')}

function macroCell(n,field){return n.hasData?escHtml(n[field])+(field==='calories'?' kcal':'g'):'Pending'}
function macroMethodText(n){if(!n?.hasData)return 'Nutrition pending';if(n.method!=='4-4-9')return 'Standard fixed nutrition';return '4-4-9 calories: '+n.macroCalories+' kcal'+(n.warning?' - review ingredient calories difference '+n.difference+' kcal':' - validated')}
function menuMacroCategoryTable(day,type,index){const rows=mealCategories.map(cat=>{const code=cat[0];const n=calculatedNutrition(day,type,index,code);return [badge(code,mealCategories.findIndex(x=>x[0]===code)),cat[1]+'g',cat[2]+'g',macroCell(n,'calories'),macroCell(n,'protein'),macroCell(n,'carbs'),macroCell(n,'fat')]});return table(['Category','Chicken / Meat','Rice / Potato','Calories','Protein','Carbs','Fat'],rows)}
function menuMacroReportHtml(){const reportDays=[...menuDays,'Friday'];const blocks=reportDays.map(day=>'<section class="menu-report-day"><h2>'+escHtml(day)+(day==='Friday'?' <span>same menu as Thursday, printed separately for Friday customers</span>':'')+'</h2>'+menuMealTypes.map(type=>'<div class="menu-report-meal"><h3>'+escHtml(type)+(type==='Breakfast'||type==='Snacks'?' <span>standard macros for all categories</span>':' <span>automatic category macros A-F</span>')+'</h3>'+weeklyMenu[day][type].map((item,i)=>{if(type==='Lunch'||type==='Dinner'){const base=combinedNutritionRow(day,type,i);const baseText=combinedHasData(base)?(base.calories+' kcal - P '+base.protein+'g - C '+base.carbs+'g - F '+base.fat+'g - base '+base.baseProtein+'g + '+base.baseCarbs+'g'):'Base macros pending';return '<article class="menu-report-item category-report-item"><div class="menu-report-item-head"><strong>Option '+(i+1)+' - '+escHtml(item)+'</strong><small>'+escHtml(baseText)+'</small></div>'+menuMacroCategoryTable(day,type,i)+'</article>'}const n=calculatedNutrition(day,type,i,'A');return '<article class="menu-report-item standard-report-item"><div class="menu-report-item-head"><strong>Option '+(i+1)+' - '+escHtml(item)+'</strong><small>Standard item for all customers</small></div>'+table(['Calories','Protein','Carbs','Fat'],[[macroCell(n,'calories'),macroCell(n,'protein'),macroCell(n,'carbs'),macroCell(n,'fat')]])+'</article>'}).join('')+'</div>').join('')+'</section>').join('');return '<section class="panel menu-macro-report print-report"><div class="print-preview-actions no-print"><button class="primary-btn light" id="backReportsFromMacro">Back to Reports</button><a class="primary-btn light pdf-download-link" id="downloadMenuMacroPdf" href="Triangle_Menu_Macro_Report.pdf" download="Triangle_Menu_Macro_Report.pdf">Download PDF</a><button class="primary-btn green" id="printMenuMacroReport">Print Menu Macro Report</button></div><div class="print-head"><div><h1>Triangle Healthy Kitchen Menu Macro Report</h1><span>Breakfast/snacks standard. Lunch/dinner generated by customer category portions.</span></div><span>'+new Date().toLocaleString()+'</span></div><div class="category-reference">'+table(['Category','Chicken / Meat','Rice / Potato','Notes'],mealCategories.map(c=>[badge(c[0],mealCategories.findIndex(x=>x[0]===c[0])),c[1]+'g',c[2]+'g',escHtml(c[3])]))+'</div>'+blocks+'</section>'}
function renderMenuMacroReport(){state.module='menu-macro-report';$('#pageTitle').textContent='Menu Macro Report';$('#workspace').innerHTML=menuMacroReportHtml();document.body.classList.remove('customer-mode');document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.module==='reports'));$('#backReportsFromMacro')?.addEventListener('click',()=>renderReports());$('#printMenuMacroReport')?.addEventListener('click',()=>window.print());toast('Menu macro report opened. Click Print or Download PDF when ready.')}
globalThis.renderMenuMacroReport=renderMenuMacroReport;

function isoDate(date){const d=new Date(date);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function dayNameFromDate(date){return new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long'})}
function displayDate(date){return new Date(date+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
function validDateValue(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))}
function productionWeekNumber(c,date){const start=validDateValue(c.subscriptionStart)?new Date(c.subscriptionStart+'T12:00:00'):new Date(date+'T12:00:00');const current=new Date(date+'T12:00:00');const diff=Math.max(0,Math.floor((current-start)/(1000*60*60*24)));return Math.min(4,Math.floor(diff/7)+1)}
function isActiveForProduction(c,date){if(/paused|expired|pending|stopped|rejected/i.test(c.status||''))return false;if(!shouldDeliverOnDate(c,date))return false;const selected=new Date(date+'T12:00:00');if(validDateValue(c.subscriptionStart)&&selected<new Date(c.subscriptionStart+'T12:00:00'))return false;const progress=packageProgress(c);if(validDateValue(progress.completionDate)&&selected>new Date(progress.completionDate+'T12:00:00'))return false;return true}
function noteParts(note){return String(note||'').split(/\n|,/).map(x=>x.trim()).filter(Boolean)}
function kitchenSpecialNotes(note){const parts=noteParts(note).filter(x=>!/^(allergies|medical|diet):/i.test(x));return parts.length?parts.join(' | '):'No special note'}
function macroTextForCategory(cat){const row=mealCategoryRow(cat);return row[1]+'P/'+row[2]+'C'}
function productionSampleCustomers(){const cats=['A','C','D','A','C','D','B','E','F','A','C','D','B','E','F','A','C','D','B','E'];const names=['Ahmed Ali','Sara Fatima','Mariam Noor','Mohamed Hassan','Aisha Salem','Nisha Thomas','Ali Kareem','Fatima Omar','Khalid Nasser','Noora Hamad','Yousef Rahman','Lina Joseph','Omar Mansoor','Huda Khan','Rami George','Dana Al Kuwari','Zain Saleh','Maya Philip','Issa Rahman','Mona Saleh'];const notes=['No Mushroom','No Mushroom','No Onion','No Mushroom','No Mushroom','No Onion','No spicy','No spicy','No spicy','No tomato','No tomato','No tomato','No lactose','No lactose','No lactose','No nuts','No nuts','No nuts','No cheese','No cheese'];return names.map((name,i)=>{const pkg=i%5===0?'2m1s':'3m1s';return {name,cat:cats[i],status:'Active',subscriptionStart:'2026-06-20',subscriptionEnd:'2026-07-20',mealPackageId:pkg,includeFriday:false,plan:packagePlanName(pkg),notes:notes[i],weeks:[1,2,3,4].map(w=>({week:w,days:{Saturday:true,Sunday:true,Monday:true,Tuesday:true,Wednesday:true,Thursday:true,Friday:false},menuOptions:{Breakfast:((i+w)%4)+1,Lunch:((i+w+1)%4)+1,Dinner:((i+w+2)%4)+1,Snacks:[((i+w+3)%4)+1]},fridayOptions:{},notes:''}))}})}
function selectedProductionCustomers(date){return customers.filter(c=>isActiveForProduction(c,date))}
function customerDifferentChoices(c){return Array.isArray(c.differentChoices)?c.differentChoices.filter(x=>x&&String(x.dish||'').trim()):[]}
function differentChoiceText(c){return customerDifferentChoices(c).map(x=>String(x.dish||'').trim()+' | '+String(x.cat||c.cat||'').trim()).join('\n')}
function parseDifferentChoiceText(value,c){return String(value||'').split(/\n/).map(line=>{const parts=line.split('|').map(x=>x.trim()).filter(Boolean);if(!parts.length)return null;return {dish:parts[0],cat:parts[1]||c.cat||'A'}}).filter(Boolean)}
function differentChoiceMacro(choice,c){const cat=String(choice.cat||c.cat||'A').trim();return mealCategories.some(row=>row[0]===cat)?cat+' ('+macroTextForCategory(cat)+')':cat}
function differentChoiceRowsForDate(date){if(dayNameFromDate(date)==='Friday')return [];return selectedProductionCustomers(date).filter(c=>isActiveForProduction(c,date)).flatMap(c=>customerDifferentChoices(c).map(choice=>({customer:c.name,dish:choice.dish,macro:differentChoiceMacro(choice,c)})))}
function customerProductionWeek(c,date){const num=productionWeekNumber(c,date);return (c.weeks||[]).find(w=>Number(w.week)===num)||(c.weeks||[])[0]||defaultWeekSelections()[0]}
function productionMenuChoice(c,date,type,index,fridayPackage=false){const day=dayNameFromDate(date);if(day==='Friday')return null;const week=customerProductionWeek(c,date);const dayOptions=(week.dayMenuOptions||{})[fridayPackage?'Friday':day]||{};const options=fridayPackage?(Object.keys(week.fridayOptions||{}).length?(week.fridayOptions||{}):dayOptions):(Object.keys(dayOptions).length?dayOptions:(week.menuOptions||{}));let value=options[type];if(!value&&type==='Extra Meal')value=options.Lunch;if(!value&&fridayPackage){const fallback=(week.dayMenuOptions||{}).Thursday||week.menuOptions||{};value=fallback[type]||(type==='Extra Meal'?fallback.Lunch:null)}if(!value){const seed=(index+productionWeekNumber(c,date)+type.length+(fridayPackage?1:0))%4+1;value=type==='Snacks'?[seed]:seed}return value}
function productionPackageDisplay(r){return (r.packageLabel?String(r.packageLabel)+' - ':'')+String(r.meal||'')}
function packageProductionMealSlots(pkg){const slots=[...(pkg.meals||[])];const required=Number(pkg.mealCount||slots.length);while(slots.length<required)slots.push('Extra Meal');return slots}
function addProductionMeal(rows,c,date,type,opt,packageLabel){if(!opt)return;const day=dayNameFromDate(date);const menuDay=weeklyMenu[day]?day:'Tuesday';const lookupType=type==='Extra Meal'?'Lunch':type;const displayType=type==='Extra Meal'?'Lunch':type;const mealPrefix=type==='Extra Meal'?'Extra Meal - ':'';const arr=Array.isArray(opt)?opt:[opt];arr.forEach(n=>{const optionNumber=Number(n)||0;const label=optionNumber?selectedOptionLabel(lookupType,optionNumber,menuDay):String(n||'Kitchen Choice');const meal=mealPrefix+label;rows.push({customer:c.name,meal,type:displayType,option:optionNumber||'-',packageLabel:packageLabel||day+' Package',cat:c.cat||'A',macro:macroTextForCategory(c.cat||'A'),quantity:1,note:kitchenSpecialNotes(c.notes),rawNote:c.notes||'',driver:customerDriver(c)})})}
function productionRowsForDate(date){const rows=[];const day=dayNameFromDate(date);if(day==='Friday')return rows;selectedProductionCustomers(date).forEach((c,i)=>{if(!isActiveForProduction(c,date))return;const pkg=packageById(c.mealPackageId||'3m1s');const mealSlots=packageProductionMealSlots(pkg);mealSlots.forEach(type=>addProductionMeal(rows,c,date,type,productionMenuChoice(c,date,type,i,false),day+' Package'));if(pkg.snacks)addProductionMeal(rows,c,date,'Snacks',productionMenuChoice(c,date,'Snacks',i,false),day+' Package');if(day==='Thursday'&&customerHasFriday(c)){mealSlots.forEach(type=>addProductionMeal(rows,c,date,type,productionMenuChoice(c,date,type,i,true),'Friday Package'));if(pkg.snacks)addProductionMeal(rows,c,date,'Snacks',productionMenuChoice(c,date,'Snacks',i,true),'Friday Package')}});return rows}
function groupProductionRows(rows,keyFn){const map={};rows.forEach(r=>{const key=keyFn(r);if(!map[key])map[key]=[];map[key].push(r)});return map}
function dailyReportHeader(name,date){return '<div class="daily-report-head"><img src="triangle-logo-badge-v2.png?v=20260712-09" alt="Triangle Healthy Kitchen logo"><div><h1>'+escHtml(name)+'</h1><span>Production Date: '+displayDate(date)+' - '+dayNameFromDate(date)+'</span><span>Generated: '+new Date().toLocaleString()+' - Printed By: '+escHtml(roles[state.role]?.label||'CEO/Admin')+'</span></div></div>'}
function quantitySheetHtml(rows,date){const mealTypes=['Breakfast','Lunch','Dinner','Snacks'];let grandTotal=0;const sections=mealTypes.map(type=>{const label=type==='Snacks'?'Snack':type;const typeRows=rows.filter(r=>r.type===type);grandTotal+=typeRows.length;const grouped=groupProductionRows(typeRows,productionPackageDisplay);const data=Object.entries(grouped).map(([meal,list])=>[escHtml(meal),list.length]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));if(!data.length)data.push(['<em>No '+label.toLowerCase()+' meals for this date</em>','0']);data.push(['<strong>'+label+' Total</strong>','<strong>'+typeRows.length+'</strong>']);return '<div class="quantity-meal-type"><h2>'+label.toUpperCase()+'</h2>'+table(['Package / Meal Name','Total Quantity'],data)+'</div>'}).join('');return '<section class="daily-report-sheet quantity-sheet-grouped" id="quantitySheet">'+dailyReportHeader('Quantity Sheet - Breakfast, Lunch, Dinner & Snack',date)+sections+'<div class="daily-report-total quantity-grand-total"><span>Grand Total Meals To Prepare</span><strong>'+grandTotal+'</strong></div></section>'}
function productionNoteTypeBlock(type,noted,cats){const typeRows=noted.filter(r=>r.type===type);if(!typeRows.length)return '';const byMeal=groupProductionRows(typeRows,productionPackageDisplay);const mealCards=Object.entries(byMeal).sort((a,b)=>a[0].localeCompare(b[0])).map(([meal,mealRows])=>{const categoryBlocks=cats.map(cat=>{const catRows=mealRows.filter(r=>r.cat===cat);if(!catRows.length)return '';const noteGroups=groupProductionRows(catRows,r=>r.note);const notes=Object.values(noteGroups).map(list=>escHtml(list[0].note)+' x '+list.length).sort().join(' - ');return '<p class="production-note-line"><b>'+cat+' <span>('+macroTextForCategory(cat)+')</span></b> '+notes+'</p>'}).join('');return '<article class="production-note-card"><h3>'+escHtml(meal)+'</h3>'+categoryBlocks+'</article>'}).join('');return '<section class="production-note-type"><h2>'+(type==='Snacks'?'Snack':type).toUpperCase()+'</h2><div class="production-note-card-grid">'+mealCards+'</div></section>'}
function notesSheetHtml(rows,date){const noted=rows.filter(r=>r.note!=='No special note');const cats=['A','B','C','D','E','F'];if(!noted.length)return '<section class="daily-report-sheet kitchen-notes-cards" id="notesSheet">'+dailyReportHeader('Kitchen Notes Sheet',date)+'<div class="locked-panel">No special notes for this production day.</div></section>';const breakfastSnack=['Breakfast','Snacks'].map(type=>productionNoteTypeBlock(type,noted,cats)).join('');const lunchDinner=['Lunch','Dinner'].map(type=>productionNoteTypeBlock(type,noted,cats)).join('');const sheets=[];if(breakfastSnack)sheets.push('<section class="daily-report-sheet kitchen-notes-cards kitchen-notes-breakfast-snack" id="notesSheetBreakfastSnack">'+dailyReportHeader('Kitchen Notes Sheet - Breakfast & Snack',date)+breakfastSnack+'</section>');if(lunchDinner)sheets.push('<section class="daily-report-sheet kitchen-notes-cards kitchen-notes-lunch-dinner" id="notesSheetLunchDinner">'+dailyReportHeader('Kitchen Notes Sheet - Lunch & Dinner',date)+lunchDinner+'</section>');return sheets.join('')}
function portionSheetHtml(rows,date){const cats=['A','B','C','D','E','F'];const grandTotals=Object.fromEntries(cats.map(cat=>[cat,0]));function portionTypeBlock(type){const typeRows=rows.filter(r=>r.type===type);const grouped=groupProductionRows(typeRows,productionPackageDisplay);const typeTotals=Object.fromEntries(cats.map(cat=>[cat,0]));const data=Object.entries(grouped).map(([meal,list])=>{const counts=cats.map(cat=>{const count=list.filter(r=>r.cat===cat).length;typeTotals[cat]+=count;grandTotals[cat]+=count;return count});return [escHtml(meal),...counts,list.length]}).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));const typeTotal=cats.reduce((sum,cat)=>sum+typeTotals[cat],0);if(!data.length)data.push(['<em>No '+type.toLowerCase()+' portions for this date</em>',...cats.map(()=>'0'),'0']);data.push(['<strong>'+type+' Total</strong>',...cats.map(cat=>'<strong>'+typeTotals[cat]+'</strong>'),'<strong>'+typeTotal+'</strong>']);return '<div class="portion-meal-type"><h2>'+type.toUpperCase()+'</h2>'+table(['Package / Meal Name','A<br><small>150P/120C</small>','B<br><small>200P/200C</small>','C<br><small>200P/150C</small>','D<br><small>200P/100C</small>','E<br><small>170P/150C</small>','F<br><small>150P/100C</small>','Total'],data)+'</div>'}const sections=['Lunch','Dinner'].map(portionTypeBlock).join('');const grandTotal=cats.reduce((sum,cat)=>sum+grandTotals[cat],0);const categorySummary=cats.map(cat=>'<span><b>'+cat+'</b> '+grandTotals[cat]+'</span>').join('');return '<section class="daily-report-sheet portion-sheet-compact portion-sheet-split" id="portionSheet">'+dailyReportHeader('Portion Count Sheet - Lunch & Dinner Only',date)+sections+'<div class="daily-report-total portion-grand-total"><span>Total Lunch + Dinner Portions</span><strong>'+grandTotal+'</strong><small>'+categorySummary+'</small></div></section>'}
function differentChoiceSheetHtml(date){const data=differentChoiceRowsForDate(date).map(r=>[escHtml(r.dish),escHtml(r.macro),escHtml(r.customer)]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))||String(a[2]).localeCompare(String(b[2])));return '<section class="daily-report-sheet different-choice-sheet" id="differentChoiceSheet">'+dailyReportHeader('Different Choice Sheet',date)+(data.length?table(['Dish / Different Choice','Macro','Customer Name'],data):'<div class="locked-panel">No different choice dishes for this production day.</div>')+'</section>'}
function packingSheetDailyHtml(rows,date){const data=rows.map(r=>[escHtml(r.customer),escHtml(r.packageLabel||dayNameFromDate(date)+' Package'),escHtml(r.meal),badge(r.cat,mealCategories.findIndex(c=>c[0]===r.cat)),escHtml(r.macro),r.quantity,escHtml(r.note)]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))||String(a[1]).localeCompare(String(b[1])));return '<section class="daily-report-sheet" id="packingSheet">'+dailyReportHeader('Customer Packing Sheet',date)+table(['Customer Name','Package','Meal Name','Category','Macro','Quantity','Special Notes'],data)+'</section>'}
function dailyProductionReportsHtml(date){const rows=productionRowsForDate(date);const noteMeals=new Set(rows.filter(r=>r.note!=='No special note').map(r=>r.meal)).size;const differentRows=differentChoiceRowsForDate(date);return '<section class="panel daily-production-module"><div class="panel-header no-print"><div><h2>Daily Production Reports</h2><span class="sub">Scalable layout: quantity, portion counts, kitchen notes, and outside-menu different choices.</span></div></div><div class="daily-report-controls no-print"><label><span>Production Date</span><input type="date" id="productionDate" value="'+date+'"></label><button class="primary-btn green" id="generateProductionReports">Generate Reports</button><button class="primary-btn light" id="previewProductionReports">Preview</button><button class="primary-btn" id="printProductionReports">Print</button><button class="primary-btn light" id="downloadProductionReports">Download PDF</button></div><div class="production-summary no-print">'+kpis([['Production Day',dayNameFromDate(date)],['Customers Used',selectedProductionCustomers(date).filter(c=>isActiveForProduction(c,date)).length],['Meal Portions',rows.length],['Different Choices',differentRows.length]])+'</div><div class="daily-report-book print-report">'+quantitySheetHtml(rows,date)+portionSheetHtml(rows,date)+notesSheetHtml(rows,date)+differentChoiceSheetHtml(date)+'</div></section>'}
function renderDailyProductionReports(date){state.module='daily-production-reports';const reportDate=validDateValue(date)?date:'2026-07-07';$('#pageTitle').textContent='Daily Production Reports';$('#workspace').innerHTML=dailyProductionReportsHtml(reportDate);document.body.classList.remove('customer-mode');document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.module==='reports'));$('#generateProductionReports')?.addEventListener('click',()=>renderDailyProductionReports($('#productionDate').value));$('#previewProductionReports')?.addEventListener('click',()=>toast('Preview is ready below. Scroll to check all reports.'));$('#printProductionReports')?.addEventListener('click',()=>window.print());$('#downloadProductionReports')?.addEventListener('click',()=>{toast('Use the print window and choose Save as PDF.');window.print()});toast('Daily production reports generated for '+dayNameFromDate(reportDate))}
globalThis.renderDailyProductionReports=renderDailyProductionReports;

function renderReports(){state.module='reports';moduleFrame('Reports','',kpis([['Daily Production','5 Sheets'],['Kitchen Report','Printable'],['Menu Macros','Printable'],['Customer A-Z','Ready']])+'<div class="two-col"><section class="panel"><div class="panel-header"><h2>Reports</h2></div>'+table(['Report','Includes','Action'],[['Daily Production Reports','Quantity, notes, portion counts, packing and different choice sheets for one selected day','<button class="primary-btn green" id="openDailyProductionReports">Open Production Reports</button>'],['Menu Macro Report','Full menu, standard macros, and all A-F category macros','<button class="primary-btn green" id="openMenuMacroReport">Open / Print</button>'],['Kitchen Production','Meals separated by category, total protein/carbs, notes','<button class="primary-btn" onclick="openModule(\'kitchen\')">Open</button>'],['Customer A-Z','Customer, plan, category, address, notes, payments','Open'],['Driver Zones','Six drivers, route timing, live zone status','Open'],['Revenue','Packages, paid, pending, custom packages','Open']])+'</section><section class="panel"><h2>Daily Production</h2><p class="sub">Reports use active customers and saved menu choices for the selected production date.</p><button class="primary-btn green" id="openDailyProductionReportsSide">Generate Reports</button><hr style="border:0;border-top:1px solid var(--line);margin:14px 0"><h2>Menu Macro Print</h2><p class="sub">Print confirmed menu calories, protein, carbs and fat by category.</p><button class="primary-btn light" id="openMenuMacroReportSide">Open Menu Macro Report</button></section></div>');$('#openMenuMacroReport')?.addEventListener('click',renderMenuMacroReport);$('#openMenuMacroReportSide')?.addEventListener('click',renderMenuMacroReport);$('#openDailyProductionReports')?.addEventListener('click',()=>renderDailyProductionReports(new Date().toISOString().slice(0,10)));$('#openDailyProductionReportsSide')?.addEventListener('click',()=>renderDailyProductionReports(new Date().toISOString().slice(0,10)))}
function openAiSettingsCard(){
  return '<section class="panel openai-settings-card"><div class="openai-card-head"><span class="openai-mark">AI</span><div><h2>OpenAI App Helper</h2><p class="sub">Describe an app problem and get a quick support suggestion.</p></div><span class="pill good">Prototype</span></div><div class="openai-helper-body"><label><span>What problem do you see?</span><textarea id="openAiIssueText" placeholder="Example: Customer registered from mobile but CEO dashboard cannot see the request..."></textarea></label><div class="openai-quick-grid"><button type="button" data-ai-prompt="registration">Registration issue</button><button type="button" data-ai-prompt="customer">Customer portal</button><button type="button" data-ai-prompt="payment">Payment problem</button><button type="button" data-ai-prompt="delivery">Delivery issue</button></div><button class="primary-btn green wide" type="button" id="openAiSuggestBtn">Get Suggestion</button><div class="openai-answer" id="openAiAnswer"><b>Ready to help</b><p>This prototype gives local guidance now. Later we can connect this card to real OpenAI with backend logs, role permissions and safe audit history.</p></div></div></section>'
}
function openAiSuggestionText(issue){
  const text=String(issue||'').toLowerCase();
  if(!text.trim())return ['Please type the issue first.','Tell the team what page, account role, button, and error message you saw.'];
  if(/mobile|phone|review|registration|approve|customer.*not|not.*show/.test(text))return ['Likely data storage difference.','In this prototype, mobile and laptop use separate browser storage. Test the full registration and CEO approval flow on the same device until real backend/database is connected.'];
  if(/bad request|bed request|not opening|link|server/.test(text))return ['Check the correct preview link.','Desktop uses http://127.0.0.1:4173/. Mobile must use the computer Wi-Fi IP with port 4174, and both devices must be on the same Wi-Fi.'];
  if(/payment|proof|cash|receipt|approve/.test(text))return ['Check payment approval flow.','Payment proof should stay pending until CEO/Admin approves it. Cash should show Cash Pending until received and approved.'];
  if(/delivery|driver|zone|area|map|location/.test(text))return ['Check delivery setup.','Confirm zone, area, driver and Google Maps link are saved separately. If map detection fails in prototype, select zone and area manually.'];
  if(/login|password|otp|verification|forgot/.test(text))return ['Check authentication flow.','Confirm the account type, phone number, OTP verified state and password. In real backend, reset password must verify phone before allowing a new password.'];
  return ['Suggested next check.','Open the same page again with a fresh link, confirm the role you are logged in as, check whether the data was created on the same device, then test the exact button again. If it repeats, write the page name and action here.'];
}
function bindOpenAiSettingsCard(){
  document.querySelectorAll('[data-ai-prompt]').forEach(btn=>btn.addEventListener('click',()=>{
    const input=$('#openAiIssueText');
    if(!input)return;
    const prompts={registration:'Customer registration or approval is not showing in Customer Review.',customer:'Customer portal login, forgot password, or approved customer account is not opening.',payment:'Payment proof, cash pending, or approval status is not updating.',delivery:'Delivery zone, area, driver, map link, or delivery time is not working.'};
    input.value=prompts[btn.dataset.aiPrompt]||'';
    input.focus();
  }));
  $('#openAiSuggestBtn')?.addEventListener('click',()=>{
    const answer=$('#openAiAnswer');
    const [title,body]=openAiSuggestionText($('#openAiIssueText')?.value||'');
    if(answer)answer.innerHTML='<b>'+escHtml(title)+'</b><p>'+escHtml(body)+'</p>';
    toast('Suggestion ready');
  });
}
function renderSettings(){state.module='settings';moduleFrame('Settings','',kpis([['Roles','5'],['Settings Access','All Staff'],['Driver Zones','6'],['App Helper','Ready']])+'<div class="two-col settings-grid"><section class="panel"><div class="panel-header"><div><h2>Role Access</h2><span class="sub">Current prototype permissions by account.</span></div></div>'+table(['Account','Can View','Can Edit'],[['CEO','Everything','Everything'],['Admin','Everything','Everything'],['Transportation Manager','Dashboard, Delivery, Drivers, Settings','Driver assignment only'],['Kitchen Team','Dashboard, Kitchen, Meal Plans, Reports, Settings','No'],['Drivers Team','Dashboard, Delivery, Drivers, Settings','No']])+'</section>'+openAiSettingsCard()+'</div>');bindOpenAiSettingsCard()}
function locked(module){moduleFrame('Access Restricted','', '<div class="locked-panel"><h2>Access Restricted</h2><p>'+roles[state.role].label+' cannot open '+module+'. Please switch to Boss or Admin account.</p></div>')}
function openModule(module){if(!canOpen(module)){locked(module);return}({dashboard:renderDashboard,portal:renderPortal,customers:renderCustomers,subscriptions:renderSubscriptions,mealplans:renderMealPlans,kitchen:renderKitchen,packing:renderPacking,delivery:renderDelivery,drivers:renderDrivers,payments:renderPayments,reminders:renderReminders,reports:renderReports,settings:renderSettings}[module]||renderDashboard)()}
function applyRoleNav(){const r=roles[state.role];if(!r)return;document.body.classList.toggle('customer-mode',state.role==='customer');$('#accountName').textContent=r.label;document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('locked',!(r.allow==='all'||r.allow.includes(b.dataset.module))))}
document.querySelector('.nav-list').addEventListener('click',e=>{const btn=e.target.closest('.nav-item');if(!btn||btn.classList.contains('locked'))return;openModule(btn.dataset.module)});document.addEventListener('change',e=>{if(e.target?.id==='detailMealPackage'||e.target?.id==='detailIncludeFriday')refreshWeekPlannerForPackage()});
document.addEventListener('change',e=>{if(e.target?.id==='dateInput'&&state.role){if(state.module==='dashboard')renderDashboard();else updateSidebarStats()}});
$('#togglePassword')?.addEventListener('click',()=>{const input=$('#loginPassword');if(!input)return;const showing=input.type==='text';input.type=showing?'password':'text';$('#togglePassword').textContent=showing?'Show':'Hide';$('#togglePassword').setAttribute('aria-label',showing?'Show password':'Hide password')});
function selectedValues(name){return $$('input[name="'+name+'"]:checked').map(input=>input.value)}
const phoneCountries=`AF|Afghanistan|93
AL|Albania|355
DZ|Algeria|213
AS|American Samoa|1684
AD|Andorra|376
AO|Angola|244
AI|Anguilla|1264
AG|Antigua and Barbuda|1268
AR|Argentina|54
AM|Armenia|374
AW|Aruba|297
AU|Australia|61
AT|Austria|43
AZ|Azerbaijan|994
BS|Bahamas|1242
BH|Bahrain|973
BD|Bangladesh|880
BB|Barbados|1246
BY|Belarus|375
BE|Belgium|32
BZ|Belize|501
BJ|Benin|229
BM|Bermuda|1441
BT|Bhutan|975
BO|Bolivia|591
BA|Bosnia and Herzegovina|387
BW|Botswana|267
BR|Brazil|55
IO|British Indian Ocean Territory|246
VG|British Virgin Islands|1284
BN|Brunei|673
BG|Bulgaria|359
BF|Burkina Faso|226
BI|Burundi|257
KH|Cambodia|855
CM|Cameroon|237
CA|Canada|1
CV|Cape Verde|238
KY|Cayman Islands|1345
CF|Central African Republic|236
TD|Chad|235
CL|Chile|56
CN|China|86
CX|Christmas Island|61
CC|Cocos Islands|61
CO|Colombia|57
KM|Comoros|269
CG|Congo|242
CD|Congo Democratic Republic|243
CK|Cook Islands|682
CR|Costa Rica|506
CI|Cote d'Ivoire|225
HR|Croatia|385
CU|Cuba|53
CW|Curacao|599
CY|Cyprus|357
CZ|Czech Republic|420
DK|Denmark|45
DJ|Djibouti|253
DM|Dominica|1767
DO|Dominican Republic|1809
EC|Ecuador|593
EG|Egypt|20
SV|El Salvador|503
GQ|Equatorial Guinea|240
ER|Eritrea|291
EE|Estonia|372
SZ|Eswatini|268
ET|Ethiopia|251
FK|Falkland Islands|500
FO|Faroe Islands|298
FJ|Fiji|679
FI|Finland|358
FR|France|33
GF|French Guiana|594
PF|French Polynesia|689
GA|Gabon|241
GM|Gambia|220
GE|Georgia|995
DE|Germany|49
GH|Ghana|233
GI|Gibraltar|350
GR|Greece|30
GL|Greenland|299
GD|Grenada|1473
GP|Guadeloupe|590
GU|Guam|1671
GT|Guatemala|502
GG|Guernsey|44
GN|Guinea|224
GW|Guinea-Bissau|245
GY|Guyana|592
HT|Haiti|509
HN|Honduras|504
HK|Hong Kong|852
HU|Hungary|36
IS|Iceland|354
IN|India|91
ID|Indonesia|62
IR|Iran|98
IQ|Iraq|964
IE|Ireland|353
IM|Isle of Man|44
IL|Israel|972
IT|Italy|39
JM|Jamaica|1876
JP|Japan|81
JE|Jersey|44
JO|Jordan|962
KZ|Kazakhstan|7
KE|Kenya|254
KI|Kiribati|686
XK|Kosovo|383
KW|Kuwait|965
KG|Kyrgyzstan|996
LA|Laos|856
LV|Latvia|371
LB|Lebanon|961
LS|Lesotho|266
LR|Liberia|231
LY|Libya|218
LI|Liechtenstein|423
LT|Lithuania|370
LU|Luxembourg|352
MO|Macau|853
MG|Madagascar|261
MW|Malawi|265
MY|Malaysia|60
MV|Maldives|960
ML|Mali|223
MT|Malta|356
MH|Marshall Islands|692
MQ|Martinique|596
MR|Mauritania|222
MU|Mauritius|230
YT|Mayotte|262
MX|Mexico|52
FM|Micronesia|691
MD|Moldova|373
MC|Monaco|377
MN|Mongolia|976
ME|Montenegro|382
MS|Montserrat|1664
MA|Morocco|212
MZ|Mozambique|258
MM|Myanmar|95
NA|Namibia|264
NR|Nauru|674
NP|Nepal|977
NL|Netherlands|31
NC|New Caledonia|687
NZ|New Zealand|64
NI|Nicaragua|505
NE|Niger|227
NG|Nigeria|234
NU|Niue|683
NF|Norfolk Island|672
KP|North Korea|850
MK|North Macedonia|389
MP|Northern Mariana Islands|1670
NO|Norway|47
OM|Oman|968
PK|Pakistan|92
PW|Palau|680
PS|Palestine|970
PA|Panama|507
PG|Papua New Guinea|675
PY|Paraguay|595
PE|Peru|51
PH|Philippines|63
PL|Poland|48
PT|Portugal|351
PR|Puerto Rico|1787
QA|Qatar|974
RE|Reunion|262
RO|Romania|40
RU|Russia|7
RW|Rwanda|250
BL|Saint Barthelemy|590
SH|Saint Helena|290
KN|Saint Kitts and Nevis|1869
LC|Saint Lucia|1758
MF|Saint Martin|590
PM|Saint Pierre and Miquelon|508
VC|Saint Vincent and the Grenadines|1784
WS|Samoa|685
SM|San Marino|378
ST|Sao Tome and Principe|239
SA|Saudi Arabia|966
SN|Senegal|221
RS|Serbia|381
SC|Seychelles|248
SL|Sierra Leone|232
SG|Singapore|65
SX|Sint Maarten|1721
SK|Slovakia|421
SI|Slovenia|386
SB|Solomon Islands|677
SO|Somalia|252
ZA|South Africa|27
KR|South Korea|82
SS|South Sudan|211
ES|Spain|34
LK|Sri Lanka|94
SD|Sudan|249
SR|Suriname|597
SE|Sweden|46
CH|Switzerland|41
SY|Syria|963
TW|Taiwan|886
TJ|Tajikistan|992
TZ|Tanzania|255
TH|Thailand|66
TL|Timor-Leste|670
TG|Togo|228
TK|Tokelau|690
TO|Tonga|676
TT|Trinidad and Tobago|1868
TN|Tunisia|216
TR|Turkey|90
TM|Turkmenistan|993
TC|Turks and Caicos Islands|1649
TV|Tuvalu|688
UG|Uganda|256
UA|Ukraine|380
AE|United Arab Emirates|971
GB|United Kingdom|44
US|United States|1
UY|Uruguay|598
VI|US Virgin Islands|1340
UZ|Uzbekistan|998
VU|Vanuatu|678
VA|Vatican City|39
VE|Venezuela|58
VN|Vietnam|84
WF|Wallis and Futuna|681
EH|Western Sahara|212
YE|Yemen|967
ZM|Zambia|260
ZW|Zimbabwe|263`.trim().split('\n').map(row=>{const [iso,name,dial]=row.split('|');return {iso,name,dial,code:'+'+dial}})
function countryFlag(iso){return String(iso||'').toUpperCase().replace(/./g,ch=>String.fromCodePoint(127397+ch.charCodeAt(0)))}
function countryFlagUrl(iso){return 'https://flagcdn.com/w40/'+String(iso||'qa').toLowerCase()+'.png'}
function findPhoneCountry(value){return phoneCountries.find(c=>c.iso===value||c.code===value||c.name===value)||phoneCountries.find(c=>c.iso==='QA')}
function countrySearchText(c){return (c.name+' '+c.code+' '+c.iso).toLowerCase()}
const phoneLengthOverrides={
  AC:[5,6],AD:6,AE:9,AF:9,AG:10,AI:10,AL:[8,9],AM:8,AO:9,AR:[10,11],AS:10,AT:[10,13],AU:9,AW:7,AX:[7,10],AZ:9,
  BA:8,BB:10,BD:10,BE:9,BF:8,BG:[8,9],BH:8,BI:8,BJ:8,BL:9,BM:10,BN:7,BO:8,BQ:7,BR:[10,11],BS:10,BT:8,BW:8,BY:9,BZ:7,
  CA:10,CC:9,CD:9,CF:8,CG:9,CH:9,CI:10,CK:5,CL:9,CM:9,CN:11,CO:10,CR:8,CU:8,CV:7,CW:7,CX:9,CY:8,CZ:9,
  DE:[10,11],DJ:8,DK:8,DM:10,DO:10,DZ:9,EC:9,EE:[7,8],EG:10,ER:7,ES:9,ET:9,FI:[9,12],FJ:7,FK:5,FM:7,FO:6,FR:9,
  GA:8,GB:10,GD:10,GE:9,GF:9,GG:10,GH:9,GI:8,GL:6,GM:7,GN:9,GP:9,GQ:9,GR:10,GT:8,GU:10,GW:7,GY:7,
  HK:8,HN:8,HR:9,HT:8,HU:9,ID:[9,12],IE:9,IL:9,IM:10,IN:10,IO:7,IQ:10,IR:10,IS:7,IT:[9,10],
  JE:10,JM:10,JO:9,JP:[10,11],KE:9,KG:9,KH:[8,9],KI:8,KM:7,KN:10,KP:[8,10],KR:[9,10],KW:8,KY:10,KZ:10,
  LA:[8,10],LB:8,LC:10,LI:7,LK:9,LR:[7,9],LS:8,LT:8,LU:9,LV:8,LY:9,MA:9,MC:8,MD:8,ME:8,MF:9,MG:9,MH:7,MK:8,ML:8,MM:[8,10],MN:8,MO:8,MP:10,MQ:9,MR:8,MS:10,MT:8,MU:8,MV:7,MW:9,MX:10,MY:[9,10],MZ:9,
  NA:9,NC:6,NE:8,NF:6,NG:10,NI:8,NL:9,NO:8,NP:10,NR:7,NU:7,NZ:[8,10],
  OM:8,PA:8,PE:9,PF:8,PG:[7,8],PH:10,PK:10,PL:9,PM:6,PR:10,PS:9,PT:9,PW:7,PY:9,
  QA:8,RE:9,RO:9,RS:9,RU:10,RW:9,SA:9,SB:7,SC:7,SD:9,SE:[9,10],SG:8,SH:5,SI:8,SK:9,SL:8,SM:10,SN:9,SO:[8,9],SR:7,SS:9,ST:7,SV:8,SX:10,SY:9,SZ:8,
  TC:10,TD:8,TG:8,TH:9,TJ:9,TK:4,TL:8,TM:8,TN:8,TO:7,TR:10,TT:10,TV:5,TW:9,TZ:9,
  UA:9,UG:9,US:10,UY:8,UZ:9,VA:[6,10],VC:10,VE:10,VG:10,VI:10,VN:9,VU:[5,7],WF:6,WS:7,XK:8,YE:9,YT:9,ZA:9,ZM:9,ZW:9
}
function phoneRuleForCountry(country){const iso=country?.iso||'QA';const rule=phoneLengthOverrides[iso];if(Array.isArray(rule))return {min:rule[0],max:rule[1],label:rule[0]===rule[1]?rule[0]+' digits':rule[0]+'-'+rule[1]+' digits'};if(Number(rule))return {min:rule,max:rule,label:rule+' digits'};return {min:6,max:15,label:'6-15 digits'}}
function selectedRegisterCountry(){return findPhoneCountry($('#regCountryBtn')?.dataset.countryIso||'QA')}
function normalizePhoneDigits(value){return String(value||'').replace(/[^\d]/g,'')}
function sanitizeRegisterPhoneInput(){const input=$('#regPhoneLocal');if(!input)return '';const rule=phoneRuleForCountry(selectedRegisterCountry());const digits=normalizePhoneDigits(input.value).slice(0,rule.max);if(input.value!==digits)input.value=digits;return digits}
function currentRegisterPhone(){const code=$('#regCountryCode')?.textContent.trim()||'+974';const local=normalizePhoneDigits($('#regPhoneLocal')?.value||'');return local?code+local:code}
function ensureRegisterOtp(){if(!state.regOtp)state.regOtp={phone:'',sent:false,verified:false,code:'',verificationToken:'',verifiedAt:'',expiresAt:0,resendAt:0,attempts:0,lockedUntil:0,verifying:false,modalOpen:false,modalDismissed:false};if(typeof state.regOtp.modalDismissed==='undefined')state.regOtp.modalDismissed=false;return state.regOtp}
function otpDigitInputs(){return $$('#regOtpInputs .otp-digit')}
function otpModalCode(){return otpDigitInputs().map(input=>normalizePhoneDigits(input.value).slice(0,1)).join('')}
function setOtpModalCode(code){const digits=normalizePhoneDigits(code).slice(0,6);otpDigitInputs().forEach((input,index)=>{input.value=digits[index]||''});renderOtpModalState()}
function otpTimerText(seconds){const safe=Math.max(0,Number(seconds)||0);return '00:'+String(safe).padStart(2,'0')}
function setOtpModalStatus(message='',kind=''){const status=$('#regOtpModalStatus');if(!status)return;status.textContent=trSmart(message||'Enter the code to verify your mobile number.');status.className='otp-modal-status'+(kind?' '+kind:'')}
function mockRegisterOtpBackendVerify(phone,code){return new Promise(resolve=>setTimeout(()=>resolve({ok:code==='123456',phone,verifiedAt:new Date().toISOString(),reason:code==='000000'?'expired':'invalid'}),650))}
function stopOtpCountdown(){if(state.regOtpTimer){clearInterval(state.regOtpTimer);state.regOtpTimer=null}}
function startOtpCountdown(){const otp=ensureRegisterOtp();otp.resendAt=Date.now()+45000;stopOtpCountdown();state.regOtpTimer=setInterval(renderOtpModalState,500);renderOtpModalState()}
function renderOtpModalState(){const otp=ensureRegisterOtp(),resend=$('#regOtpResend'),confirm=$('#regOtpConfirm');const complete=otpModalCode().length===6;const wait=Math.ceil(((otp.resendAt||0)-Date.now())/1000);if(resend){if(wait>0){resend.disabled=true;resend.textContent='Resend code in '+otpTimerText(wait)}else{resend.disabled=!!otp.verifying;resend.textContent='Resend Code';if(state.regOtpTimer)stopOtpCountdown()}}if(confirm){confirm.disabled=!complete||!!otp.verifying||Date.now()<(otp.lockedUntil||0);confirm.innerHTML=otp.verifying?'<span class="otp-spinner" aria-hidden="true"></span> Verifying...':'Verify'}otpDigitInputs().forEach(input=>input.disabled=!!otp.verifying)}
function renderRegisterOtp(message='',kind=''){const card=$('#regOtpCard'),send=$('#regSendOtp'),openAgain=$('#regOpenOtpAgain'),change=$('#regChangePhone'),status=$('#regOtpStatus'),phoneInput=$('#regPhoneLocal'),countryBtn=$('#regCountryBtn');if(!card||!status)return;const otp=ensureRegisterOtp(),current=currentRegisterPhone(),sent=!!otp.sent&&otp.phone===current,verified=!!otp.verified&&otp.phone===current;card.classList.toggle('verified',verified);card.classList.toggle('error',kind==='error');const showSend=!sent&&!verified,showOpen=sent&&!verified&&!otp.modalOpen,showChange=verified;if(send){send.hidden=!showSend;send.classList.toggle('hidden',!showSend);send.disabled=false;send.textContent='Send Code'}if(openAgain){openAgain.hidden=!showOpen;openAgain.classList.toggle('hidden',!showOpen);openAgain.textContent='Open again'}if(change){change.hidden=!showChange;change.classList.toggle('hidden',!showChange);change.textContent='Change number'}if(phoneInput)phoneInput.disabled=verified;if(countryBtn)countryBtn.disabled=verified;if(verified){status.textContent=trSmart(message||'Mobile verified');status.className='otp-status-note success'}else if(kind==='error'){status.textContent=trSmart(message||'Please verify your mobile number.');status.className='otp-status-note error'}else{status.textContent=trSmart(message||(sent?'Code sent. Verify in popup.':'Verify your mobile number to continue.'));status.className='otp-status-note'}syncRegisterPasswordAccess()}
function resetRegisterOtp(message='Verify your mobile number to continue.'){stopOtpCountdown();state.regOtp={phone:currentRegisterPhone(),sent:false,verified:false,code:'',verificationToken:'',verifiedAt:'',expiresAt:0,resendAt:0,attempts:0,lockedUntil:0,verifying:false,modalOpen:false,modalDismissed:false};setOtpModalCode('');renderRegisterOtp(message)}
function isRegisterPhoneVerified(){const otp=ensureRegisterOtp();return !!otp.verified&&otp.phone===currentRegisterPhone()}
function openRegisterOtpModal(message='Enter the code to verify your mobile number.',kind=''){const layer=$('#regOtpModalLayer'),modal=$('#regOtpModal'),text=$('#regOtpText');if(!layer||!modal)return;const otp=ensureRegisterOtp();otp.modalOpen=true;otp.modalDismissed=false;state.regOtpReturnFocus=document.activeElement;layer.hidden=false;document.body.classList.add('otp-modal-open');if(text)text.textContent='We have sent a 6-digit verification code to '+currentRegisterPhone()+'.';setOtpModalStatus(message,kind);setOtpModalCode('');renderOtpModalState();setTimeout(()=>otpDigitInputs()[0]?.focus(),60)}
function closeRegisterOtpModal(force=false){const otp=ensureRegisterOtp();if(otp.verifying&&!force)return;const layer=$('#regOtpModalLayer');if(layer)layer.hidden=true;if(otp.sent&&!otp.verified&&!force)otp.modalDismissed=true;otp.modalOpen=false;document.body.classList.remove('otp-modal-open');renderRegisterOtp();(state.regOtpReturnFocus||$('#regOpenOtpAgain')||$('#regSendOtp'))?.focus?.()}
async function sendRegisterOtp(options={}){if(!syncRegisterPhoneRule(true)){const country=selectedRegisterCountry();$('#regPhoneLocal')?.focus();toast(country.name+' mobile number must be '+phoneRuleForCountry(country).label);renderRegisterOtp('Enter a valid mobile number before sending the code.','error');return}const otp=ensureRegisterOtp();const phone=currentRegisterPhone();try{const result=realDataMode?await window.THK_API.sendOtp(phone,'registration'):{ok:true,devCode:'123456'};otp.phone=phone;otp.sent=true;otp.verified=false;otp.verificationToken='';otp.verifiedAt='';otp.code=result.devCode||'';otp.expiresAt=Date.now()+10*60*1000;otp.attempts=0;otp.lockedUntil=0;otp.verifying=false;otp.modalDismissed=false;renderRegisterOtp(options.resend?'A new verification code has been sent.':'Code sent. Verify in popup.');startOtpCountdown();openRegisterOtpModal(options.resend?'A new verification code has been sent.':'Enter the 6-digit code.');toast(result.devCode?'Development SMS code: '+result.devCode:(options.resend?'A new verification code has been sent.':'Verification code sent'))}catch(error){renderRegisterOtp(backendApiErrorMessage(error,'Verification code could not be sent.'),'error');toast(backendApiErrorMessage(error,'Verification code could not be sent.'))}}
function autoSendRegisterOtpIfReady(){const country=selectedRegisterCountry();const rule=phoneRuleForCountry(country);const digits=normalizePhoneDigits($('#regPhoneLocal')?.value||'');const current=currentRegisterPhone();const otp=ensureRegisterOtp();if(digits.length<rule.min||digits.length>rule.max)return;if(otp.verified&&otp.phone===current)return;if(otp.sent&&otp.phone===current){if(!otp.modalOpen&&!otp.modalDismissed)openRegisterOtpModal('Enter the 6-digit code.');return}sendRegisterOtp({auto:true})}
async function verifyRegisterOtp(){const otp=ensureRegisterOtp(),code=otpModalCode();if(code.length!==6){setOtpModalStatus('Enter all 6 digits before verifying.','error');renderOtpModalState();return}if(!otp.sent||otp.phone!==currentRegisterPhone()){setOtpModalStatus('Please send a new code for this mobile number.','error');renderRegisterOtp('Please send a new code for this mobile number.','error');return}if(Date.now()<(otp.lockedUntil||0)){setOtpModalStatus('Too many attempts. Please wait before trying again.','error');renderOtpModalState();return}if(Date.now()>(otp.expiresAt||0)){setOtpModalStatus('This code has expired. Please request a new code.','error');renderOtpModalState();return}otp.verifying=true;setOtpModalStatus('Verifying...','loading');renderOtpModalState();try{const result=realDataMode?await window.THK_API.verifyOtp(otp.phone,'registration',code):await mockRegisterOtpBackendVerify(otp.phone,code);otp.verifying=false;if(result.ok||result.verified){otp.verified=true;otp.verificationToken=result.verificationToken||'';otp.verifiedAt=result.verifiedAt||new Date().toISOString();setOtpModalStatus('Mobile number verified successfully.','success');renderRegisterOtp('Mobile number verified successfully.');toast('Mobile number verified');renderRegisterSummary();setTimeout(()=>closeRegisterOtpModal(true),850);return}throw new Error('Invalid code')}catch(error){otp.verifying=false;otp.attempts=(otp.attempts||0)+1;if(otp.attempts>=3){otp.lockedUntil=Date.now()+30000;setOtpModalStatus('Too many attempts. Please wait 30 seconds and try again.','error');setTimeout(renderOtpModalState,30050)}else setOtpModalStatus(backendApiErrorMessage(error,'Invalid code. Please check and try again.'),'error');renderOtpModalState()}}
function bindRegisterOtp(){const card=$('#regOtpCard');if(card?.dataset.bound)return;if(card)card.dataset.bound='yes';$('#regSendOtp')?.addEventListener('click',()=>sendRegisterOtp());$('#regOpenOtpAgain')?.addEventListener('click',()=>openRegisterOtpModal('Enter the 6-digit code.'));$('#regChangePhone')?.addEventListener('click',()=>{resetRegisterOtp('Enter your mobile number and send a new code.');$('#regPhoneLocal')?.focus()});$('#regOtpConfirm')?.addEventListener('click',verifyRegisterOtp);$('#regOtpResend')?.addEventListener('click',()=>sendRegisterOtp({resend:true}));['#regOtpCancel','#regOtpClose'].forEach(sel=>$(sel)?.addEventListener('click',()=>closeRegisterOtpModal()));otpDigitInputs().forEach((input,index,inputs)=>{input.addEventListener('input',e=>{e.target.value=normalizePhoneDigits(e.target.value).slice(-1);if(e.target.value&&inputs[index+1])inputs[index+1].focus();renderOtpModalState();if(otpModalCode().length===6)verifyRegisterOtp()});input.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!input.value&&inputs[index-1]){e.preventDefault();inputs[index-1].focus();inputs[index-1].value='';renderOtpModalState()}});input.addEventListener('paste',e=>{e.preventDefault();setOtpModalCode(e.clipboardData.getData('text'));const next=inputs[Math.min(otpModalCode().length,5)];next?.focus();if(otpModalCode().length===6)verifyRegisterOtp()})});document.addEventListener('keydown',e=>{const otp=ensureRegisterOtp();if(!otp.modalOpen)return;if(e.key==='Escape'){e.preventDefault();closeRegisterOtpModal();return}if(e.key==='Tab'){const focusable=[$('#regOtpClose'),...otpDigitInputs(),$('#regOtpResend'),$('#regOtpCancel'),$('#regOtpConfirm')].filter(el=>el&&!el.disabled);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});renderRegisterOtp()}
function syncRegisterPhone(){sanitizeRegisterPhoneInput();const phone=$('#regPhone');if(phone)phone.value=currentRegisterPhone();const otp=ensureRegisterOtp();const current=currentRegisterPhone();if((otp.sent||otp.verified)&&otp.phone&&otp.phone!==current)resetRegisterOtp('Phone changed. Please send a new code.');else renderRegisterOtp();syncRegisterPhoneRule(false);autoSendRegisterOtpIfReady();renderRegisterSummary()}
function syncRegisterPhoneRule(showError=true){const note=$('#regPhoneRule');if(!note)return true;const country=selectedRegisterCountry();const rule=phoneRuleForCountry(country);const digits=normalizePhoneDigits($('#regPhoneLocal')?.value||'');note.classList.remove('good','bad');const helper=country.name+' number: '+rule.label;if(!digits){note.textContent=helper;return false}const valid=digits.length>=rule.min&&digits.length<=rule.max;if(valid){note.textContent='Valid '+country.name+' number';note.classList.add('good');return true}note.textContent=showError?'Enter '+rule.label+' for '+country.name:helper;if(showError)note.classList.add('bad');return false}
function syncRegisterPasswordAccess(){const verified=isRegisterPhoneVerified();const pass=$('#regPassword'),confirm=$('#regConfirmPassword'),passBtn=$('#toggleRegPassword'),confirmBtn=$('#toggleRegConfirmPassword'),note=$('#regPasswordLockNote');[[pass,'Create password'],[confirm,'Confirm password']].forEach(([input,placeholder])=>{if(!input)return;input.disabled=!verified;input.placeholder=verified?placeholder:'Verify mobile first';if(!verified)input.value=''});[passBtn,confirmBtn].forEach(btn=>{if(btn)btn.disabled=!verified});['#regPasswordLabel','#regConfirmPasswordLabel'].forEach(sel=>$(sel)?.classList.toggle('locked',!verified));if(note){note.textContent=verified?'Mobile verified. Now create your password.':'Verify your mobile number to create your password.';note.classList.toggle('good',verified)}}
function syncRegisterPasswordMatch(){const passInput=$('#regPassword'),confirmInput=$('#regConfirmPassword');const pass=passInput?.value||'';const confirm=confirmInput?.value||'';const note=$('#regPasswordMatch');if(!note)return true;note.classList.remove('good','bad');if(passInput?.disabled||confirmInput?.disabled){note.textContent='';return false}if(!pass&&!confirm){note.textContent='';return true}if(pass&&confirm&&pass===confirm){note.textContent='Passwords match';note.classList.add('good');return true}if(confirm){note.textContent='Passwords do not match';note.classList.add('bad');return false}note.textContent='Please confirm your password';return false}
function renderCountryList(filter=''){const list=$('#regCountryList');if(!list)return;const q=String(filter||'').trim().toLowerCase();const countries=phoneCountries.filter(c=>!q||countrySearchText(c).includes(q)).slice(0,240);list.innerHTML=countries.length?countries.map(c=>'<button type="button" data-country-iso="'+c.iso+'" data-country-code="'+c.code+'" data-country-name="'+escHtml(c.name)+'"><img class="country-flag-img" src="'+countryFlagUrl(c.iso)+'" alt="'+escHtml(c.name)+' flag"><strong>'+escHtml(c.name)+'</strong><b>'+c.code+'</b></button>').join(''):'<div class="country-empty">No country found</div>'}
function selectRegisterCountry(countryOrBtn){const c=countryOrBtn?.dataset?findPhoneCountry(countryOrBtn.dataset.countryIso):findPhoneCountry(countryOrBtn?.iso);if(!c)return;const flag=$('#regCountryFlag');if(flag){flag.src=countryFlagUrl(c.iso);flag.alt=c.name+' flag'}const trigger=$('#regCountryBtn');if(trigger)trigger.dataset.countryIso=c.iso;if($('#regCountryCode'))$('#regCountryCode').textContent=c.code;$('#regPhoneLocal')?.setAttribute('maxlength',String(phoneRuleForCountry(c).max));$('#regCountryMenu')?.setAttribute('hidden','');trigger?.setAttribute('aria-expanded','false');if($('#regCountrySearch'))$('#regCountrySearch').value='';syncRegisterPhone();syncRegisterPhoneRule(false);$('#regPhoneLocal')?.focus()}
function bindRegisterCountrySelector(){const trigger=$('#regCountryBtn');const menu=$('#regCountryMenu');const search=$('#regCountrySearch');if(!trigger||!menu||trigger.dataset.bound)return;trigger.dataset.bound='yes';renderCountryList();selectRegisterCountry(findPhoneCountry('QA'));trigger.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const open=menu.hasAttribute('hidden');menu.toggleAttribute('hidden',!open);trigger.setAttribute('aria-expanded',String(open));if(open){renderCountryList(search?.value||'');setTimeout(()=>search?.focus(),0)}});search?.addEventListener('input',()=>renderCountryList(search.value));menu.addEventListener('click',e=>{const btn=e.target.closest('button[data-country-iso]');if(btn)selectRegisterCountry(btn)});$('#regPhoneLocal')?.addEventListener('input',syncRegisterPhone);document.addEventListener('click',e=>{if(!e.target.closest('.phone-country-field')){menu.setAttribute('hidden','');trigger.setAttribute('aria-expanded','false')}});syncRegisterPhone()}
function syncRegisterChoiceFields(){const gender=$('input[name="regGenderChoice"]:checked')?.value;if(gender&&$('#regGender'))$('#regGender').value=gender;const activity=$('input[name="regActivityChoice"]:checked')?.value;if(activity&&$('#regActivity'))$('#regActivity').value=activity;renderRegHealth();renderDeliverySummary();renderRegisterSummary();renderPackageRecommendation()}
function registerFoodNotes(){const allergies=selectedValues('regAllergy');const dislikes=selectedValues('regDislike');const medical=selectedValues('regMedical').filter(x=>x!=='None');const diet=$('input[name="regDiet"]:checked')?.value;const lines=['Allergies: '+(allergies.length?allergies.join(', '):'-'),'Medical: '+(medical.length?medical.join(', '):'-'),'Diet: '+(diet||'-')];if(dislikes.length)lines.push('Ingredients not liked: '+dislikes.join(', '));return lines.join('\n')}
function regPlanPaymentState(){
  if(!state.regPlanPayment){
    state.regPlanPayment={journey:'trial',trialDays:1,duration:'monthly',packageType:'standard',paymentMethod:'card',selections:{},acknowledged:false,processing:false,confirmed:false,orderId:'',paymentId:'',confirmedAt:''};
  }
  state.regPlanPayment.packageType='standard';
  return state.regPlanPayment;
}
function regSelectedMealPackage(){
  const recommendation=packageRecommendationPayload();
  const id=$('#regMealPackage')?.value||recommendation.recommended?.mealPackageId||'3m1s';
  return packageById(id);
}
function regDailyPackagePrice(pkg){
  return pkg&&Number(pkg.price)?Number(pkg.price)/24:0;
}
function regDurationDays(duration){
  if(duration==='weekly')return 6;
  if(duration==='twoWeeks')return 12;
  return 24;
}
function regDeliveryDayOrder(){return ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday']}
function regSelectedDeliveryDays(){
  const checked=$$('input[name="regDeliveryDay"]:checked').map(input=>input.value).filter(Boolean);
  if(checked.length)return regDeliveryDayOrder().filter(day=>checked.includes(day));
  return ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday'];
}
function regExcludedDeliveryDays(){
  const selected=regSelectedDeliveryDays();
  return regDeliveryDayOrder().filter(day=>!selected.includes(day));
}
function syncRegisterDeliveryDays(){
  const selected=regSelectedDeliveryDays();
  const includeFriday=selected.includes('Friday');
  const friday=$('#regIncludeFriday');
  if(friday)friday.checked=includeFriday;
  const hint=$('#regDeliveryDaysHint');
  if(hint){
    const excluded=regExcludedDeliveryDays();
    const count=selected.length;
    hint.textContent=count+' delivery day'+(count===1?'':'s')+' per week selected. '+(excluded.length?'No delivery on '+excluded.join(', ')+'.':'Every day delivery selected.')+(includeFriday?' Friday uses Thursday menu options.':'');
  }
  renderRegisterSummary();
  if(state.regPlanPayment){state.regPlanPayment.confirmed=false;renderRegistrationPlanPayment()}
}
function regIncludeFriday(){
  return regSelectedDeliveryDays().includes('Friday');
}
function regOperationalDate(offset){
  const d=new Date();
  d.setHours(12,0,0,0);
  d.setDate(d.getDate()+Number(offset||0));
  return d;
}
function regOperationalDayLabel(date){
  return date.toLocaleDateString('en-US',{weekday:'long'});
}
function regFirstWeekMenuDays(selectedDays){
  const wanted=Array.isArray(selectedDays)&&selectedDays.length?selectedDays:regSelectedDeliveryDays();
  const days=[];
  let offset=1;
  while(days.length<wanted.length&&offset<21){
    const date=regOperationalDate(offset++);
    const day=regOperationalDayLabel(date);
    if(!wanted.includes(day))continue;
    if(day==='Friday'){
      days.push({label:'Friday Package - Delivered Thursday',menuDay:'Thursday',packageDay:'Friday',deliveredOn:'Thursday',isFridayPackage:true});
      continue;
    }
    days.push({label:day,menuDay:day,packageDay:day,deliveredOn:day,isFridayPackage:false});
  }
  return days;
}
function regPaymentMethodLabel(method){
  return ({card:'Credit Card',apple:'Apple Pay',google:'Google Pay',cash:'Cash on Delivery'})[method]||'Credit Card';
}
function regPlanPriceSummary(){
  const plan=regPlanPaymentState();
  const pkg=regSelectedMealPackage();
  const selectedDeliveryDays=regSelectedDeliveryDays();
  const includeFriday=selectedDeliveryDays.includes('Friday');
  const daily=regDailyPackagePrice(pkg);
  const baseDays=plan.journey==='trial'?Number(plan.trialDays||1):regDurationDays(plan.duration);
  const deliveryDays=plan.journey==='subscription'?Math.max(1,Math.round(baseDays/6*selectedDeliveryDays.length)):baseDays;
  const total=pkg.custom?0:Math.round(daily*deliveryDays);
  return {pkg,includeFriday,selectedDeliveryDays,excludedDays:regExcludedDeliveryDays(),daily,baseDays,deliveryDays,total,custom:!!pkg.custom};
}
function regPlanDayNames(){
  const plan=regPlanPaymentState();
  const summary=regPlanPriceSummary();
  if(plan.journey==='trial')return Array.from({length:Number(plan.trialDays||1)},(_,i)=>'Trial Day '+(i+1));
  return regFirstWeekMenuDays(summary.selectedDeliveryDays).map((item,i)=>item.label+' - Week Menu '+(i+1));
}
function regPlanSlots(){
  const pkg=regSelectedMealPackage();
  const slots=(pkg.meals||['Breakfast','Lunch','Dinner']).slice();
  if(pkg.mealCount>=4&&!slots.includes('Extra Meal'))slots.push('Extra Meal');
  if(pkg.snacks>=1)slots.push('Snack 1');
  if(pkg.snacks>=2)slots.push('Snack 2');
  return slots.length?slots:['Breakfast','Lunch','Dinner'];
}
function regMenuDayName(label){
  if(/friday package/i.test(String(label||'')))return 'Thursday';
  const first=String(label||'').split(' - ')[0].replace(/^Trial Day \d+$/,'Saturday');
  return menuDays.includes(first)?first:'Saturday';
}
function regPlanChoiceKey(dayIndex,slot){
  return 'd'+dayIndex+'_'+String(slot).replace(/\W+/g,'');
}
function regMenuSelectOptions(dayIndex,slot,selected){
  const dayName=regMenuDayName(regPlanDayNames()[dayIndex]);
  const opts=slot==='Extra Meal'
    ?['Kitchen Choice',...optionItemsForMeal('Lunch',dayName).map(item=>'Lunch - '+item),...optionItemsForMeal('Dinner',dayName).map(item=>'Dinner - '+item)]
    :['Kitchen Choice',...optionItemsForMeal(mealTypeFromSlot(slot),dayName)];
  return opts.map(item=>'<option value="'+escAttr(item)+'" '+(item===selected?'selected':'')+'>'+escHtml(item)+'</option>').join('');
}
function regSelectedMealPreview(dayIndex,slot,selected){
  const dayName=regMenuDayName(regPlanDayNames()[dayIndex]);
  let type=mealTypeFromSlot(slot);
  let name=selected||'Kitchen Choice';
  if(/^Lunch\s+-\s+/i.test(name)){type='Lunch';name=name.replace(/^Lunch\s+-\s+/i,'').trim()}
  if(/^Dinner\s+-\s+/i.test(name)){type='Dinner';name=name.replace(/^Dinner\s+-\s+/i,'').trim()}
  if(!name||name==='Kitchen Choice')return {type,name:'Kitchen Choice',image:exploreFoodImage('Kitchen Choice',type)};
  const options=optionItemsForMeal(type,dayName);
  const index=Math.max(0,options.findIndex(item=>item===name));
  return {type,name,image:menuItemPhoto(dayName,type,index,name)||exploreFoodImage(name,type)};
}function regPlanMenuHtml(){
  const plan=regPlanPaymentState();
  const days=regPlanDayNames();
  const slots=regPlanSlots();
  return '<div class="plan-menu-days">'+days.map((day,dayIndex)=>{const fridayPackage=/friday package/i.test(day);return '<article class="plan-menu-day '+(fridayPackage?'friday-package':'')+'"><div class="plan-menu-day-head"><strong>'+escHtml(day)+'</strong><span>'+slots.length+' selections</span></div>'+(fridayPackage?'<div class="plan-menu-note">Uses Thursday menu options. This package is prepared with Thursday production.</div><button type="button" class="primary-btn light copy-thursday-menu" data-friday-day-index="'+dayIndex+'">Copy Thursday Choices</button>':'')+'<div class="plan-menu-grid">'+slots.map(slot=>{const key=regPlanChoiceKey(dayIndex,slot);const selected=plan.selections[key]||'Kitchen Choice';const preview=regSelectedMealPreview(dayIndex,slot,selected);return '<label class="plan-menu-choice-card '+(selected&&selected!=="Kitchen Choice"?'selected':'')+'"><img class="plan-menu-photo-preview" src="'+escAttr(preview.image)+'" alt="'+escAttr(preview.name)+'"><span>'+escHtml(slot)+'</span><select class="plan-menu-select" data-plan-choice="'+escAttr(key)+'" data-plan-day="'+dayIndex+'" data-plan-slot="'+escAttr(slot)+'">'+regMenuSelectOptions(dayIndex,slot,selected)+'</select><small>'+escHtml(preview.name)+'</small></label>'}).join('')+'</div></article>'}).join('')+'</div>';
}
function regSelectedMealCount(){
  const plan=regPlanPaymentState();
  return Object.values(plan.selections||{}).filter(v=>v&&v!=='Kitchen Choice').length;
}
function regKitchenChoiceCount(){
  const total=regPlanDayNames().length*regPlanSlots().length;
  return Math.max(0,total-regSelectedMealCount());
}
function regDeliverySummaryLine(){
  const destination=$('input[name="regDeliveryType"]:checked')?.value||'Home';
  const area=$('#regArea')?.value||'-';
  const time=$('#regDeliveryTime')?.value||'08:30 AM';
  return destination+' - '+area+' - '+time;
}
function regStartDate(){
  const d=new Date();
  d.setDate(d.getDate()+1);
  d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
  return d.toISOString().slice(0,10);
}
function renderRegistrationPlanPayment(){
  const root=$('#regPlanPayment');
  if(!root)return;
  const plan=regPlanPaymentState();
  const recommendation=packageRecommendationPayload();
  const summary=regPlanPriceSummary();
  const pkg=summary.pkg;
  const isCash=plan.paymentMethod==='cash';
  const isCustom=!!summary.custom;
  const status=isCustom?'Custom Plan Request Sent':(isCash?'Registration Request Sent':'Payment Successful!');
  const method=regPaymentMethodLabel(plan.paymentMethod);
  const durationLabel=({weekly:'Weekly - 6 packages',twoWeeks:'2 Weeks - 12 packages',monthly:'4 Weeks / Monthly - 24 packages'})[plan.duration]||'4 Weeks / Monthly - 24 packages';
  const priceText=summary.custom?'CEO/Admin custom price required':money(summary.total);
  const choiceCount=regSelectedMealCount();
  const kitchenChoice=regKitchenChoiceCount();
  const selectedDaysText=summary.selectedDeliveryDays.map(day=>day.slice(0,3)).join(', ');
  const excludedDaysText=summary.excludedDays.length?summary.excludedDays.join(', '):'None';
  const payDisabled=(!plan.acknowledged||plan.processing)?'disabled':'';
  const payText=plan.confirmed?'Finish Registration':(plan.processing?'Processing Payment...':(isCustom?'Request Custom Plan':(isCash?'Send Registration Request':'Pay '+priceText+' Securely')));
  const trialPlan='<div class="plan-chip-row" aria-label="Trial duration"><button type="button" class="'+(plan.trialDays===1?'active':'')+'" data-trial-days="1">1-Day Paid Trial <small>'+money(Math.round(summary.daily||0))+'</small></button><button type="button" class="'+(plan.trialDays===2?'active':'')+'" data-trial-days="2">2-Day Paid Trial <small>'+money(Math.round((summary.daily||0)*2))+'</small></button></div>';
  const subscriptionPlan='<div class="plan-chip-row" aria-label="Subscription duration"><button type="button" class="'+(plan.duration==='weekly'?'active':'')+'" data-plan-duration="weekly">Weekly <small>6 days</small></button><button type="button" class="'+(plan.duration==='twoWeeks'?'active':'')+'" data-plan-duration="twoWeeks">2 Weeks <small>12 days</small></button><button type="button" class="'+(plan.duration==='monthly'?'active':'')+'" data-plan-duration="monthly">4 Weeks <small>24 days</small></button></div><div class="plan-level-grid standard-only"><button type="button" class="plan-level-card active" data-package-type="standard"><b>Standard</b><span>Balanced menu, free delivery and customer support.</span></button></div>';
  const successHtml=plan.confirmed?'<section class="plan-success-card"><span class="plan-success-icon">?</span><div><strong>'+escHtml(status)+'</strong><small>Order ID: '+escHtml(plan.orderId||'-')+' | Payment ID: '+escHtml(plan.paymentId||'-')+' | '+escHtml(method)+' | '+escHtml(plan.confirmedAt||new Date().toLocaleString())+'</small></div></section>':'';
  root.innerHTML='<div class="plan-checkout-shell">'+
    '<header class="plan-checkout-hero"><span>Step 12 of 12</span><h2>Complete Your Registration</h2><p>Choose how you want to start, select your meals, review your order, and confirm your payment.</p><nav aria-label="Checkout sections"><b>1. Journey</b><b>2. Plan</b><b>3. Menu</b><b>4. Summary</b><b>5. Payment</b></nav></header>'+
    '<section class="plan-payment-grid">'+
      '<div class="plan-left-column">'+
        '<article class="plan-step-card plan-journey-card"><div class="plan-section-label">1. Choose Journey</div><div class="plan-choice-grid">'+
          '<button type="button" class="plan-card-option '+(plan.journey==='trial'?'active':'')+'" data-plan-journey="trial"><span>Option A</span><strong>Start with Paid Trial</strong><small>Try our meals for 1 or 2 days before choosing a full subscription.</small></button>'+
          '<button type="button" class="plan-card-option '+(plan.journey==='subscription'?'active':'')+'" data-plan-journey="subscription"><span>Option B</span><strong>Skip Trial & Subscribe</strong><small>Begin directly with weekly, 2-week or monthly delivery.</small></button>'+
        '</div></article>'+
        '<article class="plan-step-card plan-choose-card"><div class="plan-section-label">2. Choose Plan</div>'+(plan.journey==='trial'?trialPlan:subscriptionPlan)+'<div class="plan-reco-strip"><b>Recommended for You</b><span>'+escHtml(recommendation.calories?recommendation.calories+' kcal/day':'Calories pending')+' | '+escHtml(pkg.label)+' | '+regPlanSlots().length+' slots/day</span></div><div class="plan-schedule-strip"><b>Delivery schedule</b><span>'+escHtml(selectedDaysText)+' selected. No delivery: '+escHtml(excludedDaysText)+'.</span></div>'+(pkg.mealCount>=4?'<div class="plan-extra-note"><b>Extra Meal</b><span>The 4th meal lets the customer choose from both Lunch and Dinner dishes together.</span></div>':'')+'</article>'+
      '</div>'+
      '<article class="plan-step-card plan-menu-card"><div class="plan-section-label">3. Menu Selection</div><div class="plan-menu-intro"><strong>'+escHtml(plan.journey==='trial'?plan.trialDays+' Day Paid Trial Menu':durationLabel+' Menu')+'</strong><span>'+choiceCount+' selected | '+kitchenChoice+' Kitchen Choice</span></div><div class="plan-menu-note">Unselected meals will be assigned as Kitchen Choice.</div>'+regPlanMenuHtml()+'</article>'+
      '<aside class="plan-right-column"><article class="plan-step-card plan-summary-card"><div class="plan-section-label">4. Order Summary</div><dl><dt>Journey</dt><dd>'+escHtml(plan.journey==='trial'?'Paid Trial':'Subscription')+'</dd><dt>Plan</dt><dd>'+escHtml(plan.journey==='trial'?plan.trialDays+' day trial':durationLabel)+'</dd><dt>Level</dt><dd>'+escHtml(plan.journey==='trial'?'Trial':plan.packageType.charAt(0).toUpperCase()+plan.packageType.slice(1))+'</dd><dt>Calories</dt><dd>'+escHtml(recommendation.calories?recommendation.calories+' kcal/day':'Pending')+'</dd><dt>Meal package</dt><dd>'+escHtml(pkg.label)+'</dd><dt>Delivery days</dt><dd>'+summary.deliveryDays+'</dd><dt>Selected schedule</dt><dd>'+escHtml(selectedDaysText)+'</dd><dt>No delivery</dt><dd>'+escHtml(excludedDaysText)+'</dd><dt>Selected meals</dt><dd>'+choiceCount+'</dd><dt>Kitchen Choice</dt><dd>'+kitchenChoice+'</dd><dt>Start date</dt><dd>'+escHtml(displayDate(regStartDate()))+'</dd><dt>Delivery</dt><dd>'+escHtml(regDeliverySummaryLine())+'</dd><dt>Delivery fee</dt><dd>Included</dd><dt>Discount</dt><dd>QAR 0</dd><dt>Final total</dt><dd class="plan-total">'+escHtml(priceText)+'</dd></dl></article>'+
      '<article class="plan-step-card plan-payment-card"><div class="plan-section-label">5. Payment</div><div class="plan-payment-methods">'+['card','apple','google','cash'].map(methodKey=>'<button type="button" class="'+(plan.paymentMethod===methodKey?'active':'')+'" data-payment-method="'+methodKey+'">'+escHtml(regPaymentMethodLabel(methodKey))+'</button>').join('')+'</div><label class="plan-ack-row"><input type="checkbox" id="regPlanAck" '+(plan.acknowledged?'checked':'')+'> <span>I understand that unselected meals will be assigned as Kitchen Choice.</span></label><div class="secure-badges"><span>Secure payment</span><span>QAR total</span><span>Admin review</span></div><button type="button" class="primary-btn green wide" id="regDemoPayBtn" '+payDisabled+'>'+escHtml(payText)+'</button>'+successHtml+'</article>'+
      '<article class="plan-step-card plan-flow-card"><div class="plan-section-label">What happens next?</div><ul><li>Your payment or request will be confirmed.</li><li>Your account will be created after approval.</li><li>Your selected menu will be saved.</li><li>You will receive a confirmation message.</li><li>Your delivery will begin according to the approved schedule.</li></ul></article></aside>'+
    '</section>'+
    '<div class="plan-mobile-paybar"><span><small>Total</small><strong>'+escHtml(priceText)+'</strong></span><button type="button" id="regMobilePayBtn" '+payDisabled+'>'+escHtml(payText)+'</button></div>'+
  '</div>';
}
function bindRegistrationPlanPayment(){
  if(document.body.dataset.planPaymentBound)return;
  document.body.dataset.planPaymentBound='yes';
  document.addEventListener('click',e=>{
    const plan=state.regPlanPayment;
    if(!plan)return;
    const journey=e.target.closest('[data-plan-journey]');
    const trial=e.target.closest('[data-trial-days]');
    const duration=e.target.closest('[data-plan-duration]');
    const type=e.target.closest('[data-package-type]');
    const method=e.target.closest('[data-payment-method]');
    const copyFriday=e.target.closest('.copy-thursday-menu');
    if(journey){plan.journey=journey.dataset.planJourney;plan.confirmed=false;renderRegistrationPlanPayment();return}
    if(trial){plan.trialDays=Number(trial.dataset.trialDays)||1;plan.confirmed=false;renderRegistrationPlanPayment();return}
    if(duration){plan.duration=duration.dataset.planDuration;plan.confirmed=false;renderRegistrationPlanPayment();return}
    if(type){plan.packageType='standard';plan.confirmed=false;renderRegistrationPlanPayment();return}
    if(method){plan.paymentMethod=method.dataset.paymentMethod;plan.confirmed=false;renderRegistrationPlanPayment();return}
    if(copyFriday){
      const days=regPlanDayNames();
      const fridayIndex=Number(copyFriday.dataset.fridayDayIndex);
      const thursdayIndex=days.findIndex(day=>/^Thursday\b/i.test(day));
      if(thursdayIndex<0){toast('Thursday menu is not available to copy.');return}
      regPlanSlots().forEach(slot=>{plan.selections[regPlanChoiceKey(fridayIndex,slot)]=plan.selections[regPlanChoiceKey(thursdayIndex,slot)]||'Kitchen Choice'});
      plan.confirmed=false;
      renderRegistrationPlanPayment();
      toast('Thursday choices copied to Friday package');
      return;
    }
    if(e.target.closest('#regDemoPayBtn,#regMobilePayBtn')){
      if(plan.confirmed){submitCustomerRegistration();return}
      const summary=regPlanPriceSummary();
      if(!plan.acknowledged){toast('Please confirm the Kitchen Choice acknowledgement first.');return}
      plan.processing=true;
      renderRegistrationPlanPayment();
      setTimeout(()=>{
        plan.processing=false;
        plan.confirmed=true;
        plan.confirmedAt=new Date().toLocaleString();
        plan.orderId='THK-'+Date.now().toString().slice(-8);
        plan.paymentId=summary.custom?'CUSTOM-REVIEW':(plan.paymentMethod==='cash'?'CASH-PENDING':'PAY-'+Math.random().toString(36).slice(2,8).toUpperCase());
        renderRegistrationPlanPayment();
        toast(summary.custom?'Custom plan sent for CEO/Admin review':(plan.paymentMethod==='cash'?'Cash pending saved for admin approval':'Payment confirmed for admin review'));
      },450);
    }
  });
  document.addEventListener('change',e=>{
    const ack=e.target.closest('#regPlanAck');
    if(ack&&state.regPlanPayment){
      state.regPlanPayment.acknowledged=ack.checked;
      state.regPlanPayment.confirmed=false;
      renderRegistrationPlanPayment();
      return;
    }
    const select=e.target.closest('.plan-menu-select');
    if(!select||!state.regPlanPayment)return;
    state.regPlanPayment.selections[select.dataset.planChoice]=select.value||'Kitchen Choice';
    state.regPlanPayment.confirmed=false;
    renderRegistrationPlanPayment();
  });
}
function collectRegistrationPlanPayment(){
  const plan=regPlanPaymentState();
  const summary=regPlanPriceSummary();
  const days=regPlanDayNames();
  const slots=regPlanSlots();
  const menuSelections=days.map((day,dayIndex)=>({day,items:slots.map(slot=>({slot,meal:plan.selections[regPlanChoiceKey(dayIndex,slot)]||'Kitchen Choice'}))}));
  const isCash=plan.paymentMethod==='cash';
  return {journey:plan.journey,trialDays:plan.journey==='trial'?Number(plan.trialDays||1):0,duration:plan.journey==='subscription'?plan.duration:'',packageType:plan.packageType,mealPackageId:summary.pkg.id,packageLabel:summary.pkg.label,dailyPrice:Number(summary.daily.toFixed(2)),baseDeliveryDays:summary.baseDays,deliveryDays:summary.deliveryDays,deliveryDaysPerWeek:summary.selectedDeliveryDays.length,selectedDeliveryDays:summary.selectedDeliveryDays,excludedDays:summary.excludedDays,includeFriday:summary.includeFriday,menuMode:plan.journey==='subscription'?'First operational week only':'Trial days only',menuStartDate:regStartDate(),fridayDeliveredOnThursday:!!summary.includeFriday,total:summary.total,custom:summary.custom,acknowledged:!!plan.acknowledged,paymentMethod:plan.paymentMethod,paymentMethodLabel:regPaymentMethodLabel(plan.paymentMethod),paymentStatus:summary.custom?'Custom Plan Review':(isCash?'Cash Pending':(plan.confirmed?'Paid':'Awaiting Payment')),accountStatus:'Pending Admin Approval',orderId:plan.orderId,paymentId:plan.paymentId,confirmedAt:plan.confirmedAt,menuSelections};
}
function recommendedCategoryFromHealth(h,goal){if(goal==='Lose Weight')return h.bmi>=30?'D':'F';if(goal==='Build Muscle')return h.bmi>=25?'C':'B';if(goal==='Maintain Weight')return 'A';return 'A'}
function renderRegisterSummary(){const box=$('#regFinalSummary');const welcome=$('#regWelcomeSummary');if(!box&&!welcome)return;const h=regHealthValues();const n=h.nutrition||{};const goal=$('input[name="regGoal"]:checked')?.value||'Build Muscle';const diet=$('input[name="regDiet"]:checked')?.value||'Balanced';const pkg=packageById($('#regMealPackage')?.value||'3m1s');const destination=$('input[name="regDeliveryType"]:checked')?.value||'Home';const notes=registerFoodNotes()||'No food notes selected';const report=h.bmiReport?escHtml(h.bmiReport.name):'Not uploaded';const estimated=n.systemRecommendedCalories?n.systemRecommendedCalories+' kcal/day':'After nutrition review';const selectedDays=regSelectedDeliveryDays();const excludedDays=regExcludedDeliveryDays();const html='<strong>Your Summary</strong><span>Birthday: '+escHtml(displayBirthDate(h.birthDate))+'</span><span>Age: '+(h.age||'-')+' years</span><span>Height: '+(h.height?h.height+' cm':'-')+'</span><span>Weight: '+(h.weight?h.weight+' kg':'-')+'</span><span>Estimated Recommended Calories: '+escHtml(estimated)+'</span><span>BMI Report: '+report+'</span><span>Goal: '+escHtml(goal)+'</span><span>Diet: '+escHtml(diet)+'</span><span>Package: '+escHtml($('#regPlan')?.value||'-')+' - '+escHtml(pkg.label)+'</span><span>Delivery Days: '+escHtml(selectedDays.join(', '))+'</span><span>No Delivery: '+escHtml(excludedDays.length?excludedDays.join(', '):'None')+'</span><span>Delivery: '+escHtml(destination)+' - '+escHtml($('#regArea')?.value||'-')+' - '+escHtml($('#regDeliveryTime')?.value||'08:30 AM')+'</span><small>'+escHtml(notes)+'</small>';if(box)box.innerHTML=html;if(welcome)welcome.innerHTML='<strong>Estimated Recommended Calories</strong><span>'+escHtml(estimated)+'</span><small>This is an estimate. Boss/Admin and nutrition team will review and finalize your plan.</small>'}
function validateRegisterStep(step){const panel=document.querySelector('[data-reg-step="'+step+'"]');if(!panel)return true;const required=[...panel.querySelectorAll('input[required]:not(:disabled),select[required]:not(:disabled),textarea[required]:not(:disabled)')];for(const input of required){if(!input.value){input.focus();toast('Please complete '+(input.closest('label')?.querySelector('span')?.textContent||'this field'));return false}}if(Number(step)===2){sanitizeRegisterPhoneInput();if(!syncRegisterPhoneRule(true)){const country=selectedRegisterCountry();$('#regPhoneLocal')?.focus();toast(country.name+' mobile number must be '+phoneRuleForCountry(country).label);return false}if(!isRegisterPhoneVerified()){renderRegisterOtp('Please verify your mobile number before continuing.','error');($('#regOtpCode')||$('#regPhoneLocal'))?.focus();toast('Please verify your mobile number first');return false}syncRegisterPasswordAccess();if(!syncRegisterPasswordMatch()){($('#regConfirmPassword')||$('#regPassword'))?.focus();toast('Password and Confirm Password must match');return false}}if(Number(step)===3&&!hasFourDigitBirthYear($('#regDob')?.value||'')){$('#regDob')?.focus();toast('Birth year must be 4 digits only');return false}if(Number(step)===9&&!regSelectedDeliveryDays().length){toast('Please select at least one delivery day.');return false}if(Number(step)===12){const plan=regPlanPaymentState();if(!plan.acknowledged){toast('Please confirm the Kitchen Choice acknowledgement first.');return false}if(!plan.confirmed){toast('Please confirm payment, cash request, or custom plan request before finishing registration.');return false}}return true}
function syncRegisterHeaderAction(){const btn=$('.team-login-icon');if(!btn)return;const inRegister=$('#customerRegisterForm')?.classList.contains('active');if(inRegister){btn.textContent=currentLang==='ar'?trSmart('Reset'):'Reset';btn.__i18nSource='Reset';btn.dataset.registerAction='reset';btn.removeAttribute('data-login-tab');btn.setAttribute('aria-label',trSmart('Reset registration'));btn.setAttribute('title',trSmart('Reset registration'))}else{btn.textContent='ST';btn.__i18nSource='ST';delete btn.dataset.registerAction;btn.dataset.loginTab='team';btn.setAttribute('aria-label','Team Login');btn.setAttribute('title','Team Login')}}
function resetRegistrationForm(){const form=$('#customerRegisterForm');if(!form)return;form.reset();state.bmiReportPreview=null;state.regPlanPayment=null;selectRegisterCountry(findPhoneCountry('QA'));resetRegisterOtp();syncRegisterChoiceFields();syncRegisterPhone();syncRegisterPasswordAccess();syncRegisterPasswordMatch();renderRegisterSummary();showRegisterStep(state.regStep||1);syncRegisterHeaderAction();toast(trSmart('Registration page reset'))}
function showRegisterStep(step){const total=12;const next=Math.max(1,Math.min(total,Number(step)||1));state.regStep=next;const activeElement=document.activeElement;if(activeElement&&typeof activeElement.blur==='function')activeElement.blur();document.querySelectorAll('.register-step').forEach(panel=>panel.classList.toggle('active',Number(panel.dataset.regStep)===next));if($('#regStepLabel')){$('#regStepLabel').textContent='Step '+next+' of '+total;$('#regStepLabel').__i18nSource='Step '+next+' of '+total}if($('#regProgressBar'))$('#regProgressBar').style.width=Math.round(next/total*100)+'%';$('#regBack')?.classList.toggle('hidden',next===1);$('#regHome')?.classList.toggle('hidden',!(next>=2&&next<=12));$('#customerRegisterMsg').textContent='';if(next===9)renderPackageRecommendation();if(next===12)renderRegistrationPlanPayment();applyI18n($('#loginScreen'));const resetScroll=()=>{const screen=$('#loginScreen');const box=$('.portal-login-box');if(screen)screen.scrollTo({top:0,left:0,behavior:'auto'});if(box)box.scrollTop=0;window.scrollTo({top:0,left:0,behavior:'auto'});};resetScroll();setTimeout(resetScroll,60)}
function openLoginPanel(panelName){document.querySelectorAll('.login-tab').forEach(x=>x.classList.toggle('active',x.dataset.loginTab===panelName));document.querySelectorAll('.login-panel').forEach(panel=>panel.classList.toggle('active',panel.dataset.loginPanel===panelName));syncRegisterHeaderAction();if(panelName==='team')forceAdminEnglish();const resetPanelScroll=()=>{const screen=$('#loginScreen');const box=$('.portal-login-box');if(screen)screen.scrollTo({top:0,left:0,behavior:'auto'});if(box)box.scrollTop=0;window.scrollTo({top:0,left:0,behavior:'auto'})};resetPanelScroll();setTimeout(resetPanelScroll,60)}
function goRegisterHome(){showRegisterStep(1);openLoginPanel('customer');toast('Back to home')}
function bindRegisterWizard(){state.regStep=1;bindRegisterCountrySelector();bindRegisterOtp();bindRegistrationPlanPayment();showRegisterStep(1);const form=$('#customerRegisterForm');if(form&&!form.dataset.enterGuard){form.dataset.enterGuard='yes';form.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.target.matches('textarea,button,[type="submit"]'))return;e.preventDefault();toast('Please use the Continue button so registration does not submit early.');});}document.querySelectorAll('.reg-next').forEach(btn=>btn.addEventListener('click',()=>{syncRegisterPhone();syncDeliveryAddressFields();if(validateRegisterStep(state.regStep)){syncRegisterChoiceFields();showRegisterStep((state.regStep||1)+1)}}));document.querySelectorAll('.register-signin-link').forEach(btn=>btn.addEventListener('click',()=>openLoginPanel('customer')));$('#regBack')?.addEventListener('click',()=>showRegisterStep((state.regStep||1)-1));$('#regHome')?.addEventListener('click',goRegisterHome);$$('input[name="regGenderChoice"],input[name="regActivityChoice"],input[name="regGoal"],input[name="regAllergy"],input[name="regDislike"],input[name="regDiet"],input[name="regDeliveryType"],input[name="regMedical"]').forEach(input=>input.addEventListener('change',()=>{if(input.name==='regMedical'&&input.value==='None'&&input.checked){$$('input[name="regMedical"]').forEach(other=>{if(other!==input)other.checked=false})}else if(input.name==='regMedical'&&input.checked){const none=$('input[name="regMedical"][value="None"]');if(none)none.checked=false}syncRegisterChoiceFields()}));['#regName','#regPhoneLocal','#regDob','#regPlan','#regMealPackage','#regArea','#regZone','#regDeliveryTime','#regAddress','#regStreetNumber','#regBuildingNumber','#regFloorNumber','#regUnitNumber','#regDeliveryNote'].forEach(sel=>$(sel)?.addEventListener('input',()=>{syncDeliveryAddressFields();renderDeliverySummary();renderRegisterSummary()}));['#regAddress','#regLocation'].forEach(sel=>$(sel)?.addEventListener('input',()=>{applyLocationZoneArea();renderRegisterSummary()}));['#regPassword','#regConfirmPassword'].forEach(sel=>$(sel)?.addEventListener('input',syncRegisterPasswordMatch));syncRegisterChoiceFields();syncRegisterPhone();syncRegisterPasswordAccess();syncRegisterPasswordMatch()}
function setupLoginTabs(){ document.querySelectorAll('.login-tab').forEach(tab=>tab.addEventListener('click',()=>{if(tab.dataset.registerAction==='reset'){resetRegistrationForm();return}if(tab.dataset.loginTab)openLoginPanel(tab.dataset.loginTab)}))}
function fillRegisterOptions(){const meal=$('#regMealPackage');if(meal&&!meal.options.length)meal.innerHTML=mealSelectionPackages.map(p=>'<option value="'+p.id+'">'+p.label+'</option>').join('');const zone=$('#regZone');const zoneList=$('#regZoneList');if(zoneList&&!zoneList.children.length)zoneList.innerHTML=zoneSearchOptions(Object.keys(qatarZones)[0]);const area=$('#regArea');const hint=$('#regAreaHint');if(zone&&!zone.value)zone.value=Object.keys(qatarZones)[0];if(zone&&area)applyRegisterZoneInput(true);if(zone&&!zone.dataset.areaBound){zone.dataset.areaBound='yes';zone.addEventListener('input',()=>applyRegisterZoneInput(false));zone.addEventListener('change',()=>applyRegisterZoneInput(true));zone.addEventListener('blur',()=>applyRegisterZoneInput(true))}if(area&&!area.dataset.summaryBound){area.dataset.summaryBound='yes';area.addEventListener('change',()=>{renderDeliverySummary();renderRegisterSummary()})}$('#regMealPackage')?.addEventListener('change',()=>{$('#postRegisterMenu')?.classList.add('hidden');syncRegisterPackagePrice();if(state.regPlanPayment){state.regPlanPayment.confirmed=false;renderRegistrationPlanPayment()}});$$('input[name="regDeliveryDay"]').forEach(input=>{if(input.dataset.deliveryBound)return;input.dataset.deliveryBound='yes';input.addEventListener('change',()=>{$('#postRegisterMenu')?.classList.add('hidden');syncRegisterDeliveryDays()})});$('#regIncludeFriday')?.addEventListener('change',()=>{renderRegisterSummary();if(state.regPlanPayment){state.regPlanPayment.confirmed=false;renderRegistrationPlanPayment()}});bindRegHealth();bindDeliveryPreferenceTools();fillDeliveryTimeSlots();syncRegisterDeliveryDays();renderDeliverySummary();bindRegisterWizard();syncRegisterPackagePrice()}
function togglePasswordButton(inputSel,btnSel){const input=$(inputSel);const btn=$(btnSel);if(!input||!btn)return;const showing=input.type==='text';input.type=showing?'password':'text';btn.textContent=showing?'Show':'Hide'}
function hideLoginScreen(){
  const screen=$('#loginScreen');
  if(!screen)return;
  screen.classList.add('hidden');
  screen.setAttribute('aria-hidden','true');
  screen.style.setProperty('display','none','important');
  screen.style.setProperty('visibility','hidden','important');
  screen.style.setProperty('opacity','0','important');
  screen.style.setProperty('pointer-events','none','important');
  screen.style.setProperty('position','absolute','important');
  screen.style.setProperty('z-index','-1','important');
}
function showLoginScreen(){
  const screen=$('#loginScreen');
  if(!screen)return;
  screen.classList.remove('hidden');
  screen.removeAttribute('aria-hidden');
  ['display','visibility','opacity','pointer-events','position','z-index'].forEach(prop=>screen.style.removeProperty(prop));
}

async function openStaffAccount(roleKey,passValue){
  roleKey=normalizeStaffRole(roleKey);
  const account=roles[roleKey];
  const error=$('#loginError');
  setStaffLoginLoading(false);
  if(!account||roleKey==='customer'){
    if(error)error.textContent='Please choose a valid team account';
    return false;
  }
  if(!String(passValue||'').trim()){
    if(error)error.textContent='Please enter the account password';
    return false;
  }
  let backendSession=null;
  if(window.THK_API?.enabled){
    setStaffLoginLoading(true);
    try{
      backendSession=await window.THK_API.staffLogin(roleKey,passValue);
    }catch(apiError){
      const localDemoValid=window.THK_API?.preserveDemoFallback&&validStaffPassword(roleKey,passValue);
      if(!backendFallbackAllowed(apiError)&&!localDemoValid){
        if(error)error.textContent=backendApiErrorMessage(apiError,'Wrong password for this account');
        setStaffLoginLoading(false);
        return false;
      }
    }
  }
  if(!backendSession&&!validStaffPassword(roleKey,passValue)){
    if(error)error.textContent='Wrong password for this account';
    setStaffLoginLoading(false);
    return false;
  }
  setStaffLoginLoading(true);
  state.role=roleKey;
  state.customerPhone=null;
  state.module='dashboard';
  state.navModule='dashboard';
  currentLang='en';
  document.documentElement.lang='en';
  document.documentElement.dir='ltr';
  document.body.classList.remove('locked-app','customer-mode');
  hideLoginScreen();
  if($('#loginPassword'))$('#loginPassword').value='';
  if(error)error.textContent='';
  try{
    if(backendSession)await syncBackendManagementData(['boss','admin'].includes(roleKey));
    applyRoleNav();
    renderDashboard();
    toast(account.label+' account opened'+(backendSession?' with secure database':' in protected demo mode'));
  }catch(err){
    console.error(err);
    document.body.classList.add('locked-app');
    showLoginScreen();
    if(error)error.textContent='Dashboard could not open. Please refresh and try again.';
    setStaffLoginLoading(false);
    return false;
  }
  setStaffLoginLoading(false);
  return true;
}
window.openStaffAccount=openStaffAccount;
async function staffLoginClick(event){
  event?.preventDefault?.();
  event?.stopPropagation?.();
  return await openStaffAccount($('#loginRole')?.value||'boss',$('#loginPassword')?.value||'');
}
window.staffLoginClick=staffLoginClick;
function bindStaffLogin(){
  const form=$('#loginForm');
  if(form&&!form.dataset.staffBound){
    form.dataset.staffBound='yes';
    form.addEventListener('submit',staffLoginClick);
  }
}
bindStaffLogin();
$('#toggleCustomerPassword')?.addEventListener('click',()=>togglePasswordButton('#customerLoginPassword','#toggleCustomerPassword'));
function findCustomerByLoginPhone(phone){ensureCustomerAccounts();const phoneKey=customerPhoneLoginKey(phone);return customers.find(c=>customerPhoneLoginKey(c.phone)===phoneKey)}
function closeForgotPasswordModal(){const modal=$('#forgotPasswordModal');if(modal)modal.remove();document.body.classList.remove('forgot-reset-open');$('#customerForgotPassword')?.focus()}
function forgotPasswordModalHtml(model){
  const phoneValue=escAttr(model.phone||'');
  const masked=model.phone?('+974 '+customerPhoneLoginKey(model.phone)):'+974 XXXXXXXX';
  const status=model.error?'<p class="forgot-reset-status error">'+escHtml(model.error)+'</p>':(model.info?'<p class="forgot-reset-status success">'+escHtml(model.info)+'</p>':'');
  const otpBoxes=Array.from({length:6},(_,i)=>'<input class="forgot-otp-input" inputmode="numeric" maxlength="1" aria-label="OTP digit '+(i+1)+'">').join('');
  const phoneStep='<div class="forgot-reset-field"><label for="forgotResetPhone">Mobile / WhatsApp number</label><div class="forgot-reset-input"><span>+974</span><input id="forgotResetPhone" inputmode="tel" autocomplete="username" placeholder="Enter Qatar mobile number" value="'+phoneValue+'"></div><small>We will verify the number before you create a new password.</small></div><button type="button" class="primary-btn green forgot-reset-wide" id="forgotSendCode">Send Verification Code</button>';
  const otpStep='<div class="forgot-reset-field"><label>Verification code</label><p class="forgot-reset-copy">We sent a 6-digit code to <b>'+escHtml(masked)+'</b>.</p><div class="forgot-otp-row">'+otpBoxes+'</div>'+(model.devCode?'<small>Development code: '+escHtml(model.devCode)+'</small>':'')+'</div><div class="forgot-reset-actions"><button type="button" class="primary-btn light" id="forgotBackToPhone">Change Number</button><button type="button" class="primary-btn green" id="forgotVerifyCode" disabled>Verify Code</button></div>';
  const passwordStep='<div class="forgot-reset-field"><label for="forgotNewPassword">New password</label><input id="forgotNewPassword" type="password" autocomplete="new-password" placeholder="Create new password"></div><div class="forgot-reset-field"><label for="forgotConfirmPassword">Confirm password</label><input id="forgotConfirmPassword" type="password" autocomplete="new-password" placeholder="Confirm new password"></div><button type="button" class="primary-btn green forgot-reset-wide" id="forgotSavePassword">Save New Password</button>';
  const doneStep='<div class="forgot-reset-success"><span aria-hidden="true">&#10003;</span><b>Password Updated</b><p>You can now login to the customer portal with your new password.</p></div>';
  const body=model.step==='otp'?otpStep:(model.step==='password'?passwordStep:(model.step==='done'?doneStep:phoneStep));
  return '<div class="review-modal-card forgot-reset-card" role="dialog" aria-modal="true" aria-labelledby="forgotResetTitle"><div class="forgot-reset-head"><span class="forgot-reset-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span><button type="button" class="forgot-reset-close" aria-label="Close password reset">Close</button></div><div class="forgot-reset-title"><b id="forgotResetTitle">Reset Customer Password</b><p>Verify your mobile number, then create a new secure password.</p></div>'+body+status+'<div class="forgot-reset-foot"><button type="button" class="forgot-reset-cancel">Cancel</button><span>Triangle Healthy Kitchen secure reset</span></div></div>';
}
function bindForgotPasswordModal(model){
  const modal=$('#forgotPasswordModal');if(!modal)return;
  const close=()=>closeForgotPasswordModal();
  modal.querySelector('.forgot-reset-close')?.addEventListener('click',close);
  modal.querySelector('.forgot-reset-cancel')?.addEventListener('click',close);
  modal.onkeydown=e=>{if(e.key==='Escape')close()};
  const phoneInput=modal.querySelector('#forgotResetPhone');
  if(phoneInput){phoneInput.focus();phoneInput.addEventListener('input',()=>{model.phone=phoneInput.value;model.error='';model.info=''})}
  modal.querySelector('#forgotSendCode')?.addEventListener('click',async()=>{
    model.phone=phoneInput?.value.trim()||model.phone;
    const key=customerPhoneLoginKey(model.phone);
    if(key.length!==8){model.error='Please enter a valid 8 digit Qatar mobile number.';model.info='';return renderForgotPasswordModal(model)}
    try{if(realDataMode){const result=await window.THK_API.sendOtp(model.phone,'password-reset');model.devCode=result.devCode||''}else{const customer=findCustomerByLoginPhone(model.phone);if(!customer){model.error='Customer account not found for this mobile number.';model.info='';return renderForgotPasswordModal(model)}model.customer=customer;model.devCode='123456'}model.step='otp';model.error='';model.info='Code sent. Please enter the 6 digit verification code.';renderForgotPasswordModal(model)}catch(error){model.error=backendApiErrorMessage(error,'Verification code could not be sent.');model.info='';renderForgotPasswordModal(model)}
  });
  const otpInputs=[...modal.querySelectorAll('.forgot-otp-input')];
  const verifyBtn=modal.querySelector('#forgotVerifyCode');
  const refreshVerify=()=>{const code=otpInputs.map(input=>input.value).join('');if(verifyBtn)verifyBtn.disabled=code.length!==6};
  otpInputs.forEach((input,index)=>{
    input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,1);if(input.value&&otpInputs[index+1])otpInputs[index+1].focus();refreshVerify();if(otpInputs.map(item=>item.value).join('').length===6)verifyBtn?.focus()});
    input.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!input.value&&otpInputs[index-1])otpInputs[index-1].focus()});
    input.addEventListener('paste',e=>{e.preventDefault();const digits=(e.clipboardData?.getData('text')||'').replace(/\D/g,'').slice(0,6);otpInputs.forEach((box,i)=>box.value=digits[i]||'');refreshVerify();if(digits.length===6)verifyBtn?.focus()});
  });
  if(otpInputs.length)otpInputs[0].focus();
  modal.querySelector('#forgotBackToPhone')?.addEventListener('click',()=>{model.step='phone';model.error='';model.info='';renderForgotPasswordModal(model)});
  verifyBtn?.addEventListener('click',async()=>{const code=otpInputs.map(input=>input.value).join('');try{if(realDataMode){const result=await window.THK_API.verifyOtp(model.phone,'password-reset',code);model.verificationToken=result.verificationToken||''}else if(code!=='123456')throw new Error('Invalid code. Please check the SMS code and try again.');model.step='password';model.error='';model.info='Mobile number verified successfully.';renderForgotPasswordModal(model)}catch(error){model.error=backendApiErrorMessage(error,'Invalid code. Please check the SMS code and try again.');model.info='';renderForgotPasswordModal(model)}});
  modal.querySelector('#forgotSavePassword')?.addEventListener('click',async()=>{
    const pass=modal.querySelector('#forgotNewPassword')?.value||'';
    const confirm=modal.querySelector('#forgotConfirmPassword')?.value||'';
    if(pass.length<8){model.error='Password must be at least 8 characters.';model.info='';return renderForgotPasswordModal(model)}
    if(pass!==confirm){model.error='Passwords do not match.';model.info='';return renderForgotPasswordModal(model)}
    try{if(realDataMode)await window.THK_API.resetPassword(model.phone,model.verificationToken,pass);else{model.customer.password=pass;saveCustomerState(model.customer)}}catch(error){model.error=backendApiErrorMessage(error,'Password could not be updated.');model.info='';return renderForgotPasswordModal(model)}
    const loginPhone=$('#customerLoginPhone');if(loginPhone)loginPhone.value=model.customer.phone||model.phone;
    const loginPass=$('#customerLoginPassword');if(loginPass)loginPass.value='';
    const loginError=$('#customerLoginError');if(loginError)loginError.textContent='Password reset successfully. Please login with your new password.';
    model.step='done';model.error='';model.info='';renderForgotPasswordModal(model);toast('Customer password updated');
    setTimeout(closeForgotPasswordModal,900);
  });
}
function renderForgotPasswordModal(model){
  let modal=$('#forgotPasswordModal');if(!modal){modal=document.createElement('div');modal.id='forgotPasswordModal';document.body.appendChild(modal)}
  modal.className='review-modal-layer forgot-reset-layer open';
  document.body.classList.add('forgot-reset-open');
  modal.innerHTML=forgotPasswordModalHtml(model);
  bindForgotPasswordModal(model);
}
function openForgotPasswordModal(){const model={step:'phone',phone:$('#customerLoginPhone')?.value.trim()||'',customer:null,verificationToken:'',devCode:'',error:'',info:''};renderForgotPasswordModal(model)}
$('#customerForgotPassword')?.addEventListener('click',openForgotPasswordModal);
document.querySelectorAll('.auth-submit-btn').forEach(btn=>btn.addEventListener('pointermove',e=>{const rect=btn.getBoundingClientRect();btn.style.setProperty('--x',(e.clientX-rect.left)+'px');btn.style.setProperty('--y',(e.clientY-rect.top)+'px')}));
$('#toggleRegPassword')?.addEventListener('click',()=>togglePasswordButton('#regPassword','#toggleRegPassword'));
$('#toggleRegConfirmPassword')?.addEventListener('click',()=>togglePasswordButton('#regConfirmPassword','#toggleRegConfirmPassword'));
$('#customerLoginForm')?.addEventListener('submit',async e=>{
  e.preventDefault();ensureCustomerAccounts();
  const phone=$('#customerLoginPhone').value.trim();const phoneKey=customerPhoneLoginKey(phone);const pass=$('#customerLoginPassword').value;const demoCustomer=customers.find(x=>customerPhoneLoginKey(x.phone)===phoneKey&&String(x.password||'')===pass);
  let c=null;let backendSession=null;
  if(window.THK_API?.enabled){
    try{backendSession=await window.THK_API.customerLogin(phone,pass);c=mergeBackendCustomer(backendSession.customer)}
    catch(apiError){const localDemoValid=window.THK_API?.preserveDemoFallback&&!!demoCustomer;if(!backendFallbackAllowed(apiError)&&!localDemoValid){$('#customerLoginError').textContent=backendApiErrorMessage(apiError,'Customer not found or password wrong.');return}}
  }
  if(!c)c=demoCustomer;
  if(!c){$('#customerLoginError').textContent='Customer not found or password wrong.';return}
  state.role='customer';state.customerPhone=c.phone;document.body.classList.remove('locked-app');hideLoginScreen();$('#customerLoginPassword').value='';$('#customerLoginError').textContent='';applyRoleNav();toast('Customer portal opened for '+c.name+(backendSession?' securely':' in demo mode'));openModule('portal');
});
async function submitCustomerRegistration(){
  syncRegisterPhone();syncRegisterChoiceFields();
  const deliveryAddress=syncDeliveryAddressFields();
  if(!validateRegisterStep(state.regStep||10))return;
  if(!isRegisterPhoneVerified()){showRegisterStep(2);renderRegisterOtp('Please verify your mobile number before sending registration.','error');toast('Please verify your mobile number first');return}
  const file=$('#regBmiReport')?.files?.[0];
  if(file&&!state.bmiReportPreview)await readBmiReportPreview(file);
  const health=regHealthValues();
  const recommendation=packageRecommendationPayload();
  const planPayment=collectRegistrationPlanPayment();
  const includeFriday=!!planPayment.includeFriday;
  const now=new Date().toISOString();
  const item={name:$('#regName').value.trim(),phone:$('#regPhone').value.trim(),phoneVerified:isRegisterPhoneVerified(),verificationToken:state.regOtp?.verificationToken||'',phoneVerifiedAt:state.regOtp?.verifiedAt||now,password:$('#regPassword').value||'',language:currentLang==='ar'?'Arabic':'English',source:'Website Registration',createdAt:now,registeredAt:now,plan:$('#regPlan').value,mealPackageId:$('#regMealPackage').value,customMeals:Number($('#regCustomMeals')?.value||0),customSnacks:Number($('#regCustomSnacks')?.value||0),caloriePackageRecommendation:recommendation,registrationPlanPayment:{...planPayment,packageType:'standard'},registrationMenuSelections:planPayment.menuSelections||[],journey:planPayment.journey,trialDays:planPayment.trialDays,subscriptionDuration:planPayment.duration,paymentStatus:planPayment.paymentStatus,payment:{status:planPayment.paymentStatus,method:planPayment.paymentMethodLabel,amount:planPayment.total,orderId:planPayment.orderId,paymentId:planPayment.paymentId,uploadedDate:planPayment.confirmedAt||todayIso(),approvedBy:'',approvedDate:'',note:'CEO/Admin approval is required before account activation.'},zone:$('#regZone').value,zoneName:zoneNameOnly($('#regZone').value),area:$('#regArea').value,address:deliveryAddress.fullAddress,streetNumber:deliveryAddress.streetNumber,buildingNumber:deliveryAddress.buildingNumber,floorNumber:deliveryAddress.floorNumber,unitNumber:deliveryAddress.unitNumber,deliveryAddress,googleLocation:$('#regLocation').value.trim(),deliveryTime:$('#regDeliveryTime').value||'08:30 AM',deliveryWindow:'08:00 - 09:00',deliveryNote:$('#regDeliveryNote')?.value.trim()||'',notes:registerFoodNotes(),goal:$('input[name="regGoal"]:checked')?.value||'Build Muscle',dietPreference:$('input[name="regDiet"]:checked')?.value||'Balanced',deliveryPreference:$('input[name="regDeliveryType"]:checked')?.value||'Home',medical:selectedValues('regMedical'),allergies:selectedValues('regAllergy'),dislikes:selectedValues('regDislike'),includeFriday,selectedDeliveryDays:planPayment.selectedDeliveryDays||regSelectedDeliveryDays(),excludedDays:planPayment.excludedDays||regExcludedDeliveryDays(),deliveryDays:planPayment.deliveryDays,subscriptionType:'Standard',health,weeks:registrationMenuSelectionsToWeeks(planPayment),trialTimeline:[{date:todayIso(),text:'New customer registered from website.'},{date:todayIso(),text:'Mobile number verified and registration submitted.'}],status:'Pending'};
  let backendSaved=false;
  if(window.THK_API?.enabled){
    const backendItem={...item,health:{...(item.health||{}),bmiReport:item.health?.bmiReport?{...item.health.bmiReport,data:'',previewData:''}:null},payment:{...(item.payment||{}),proofData:''}};
    try{
      const result=await window.THK_API.createRegistration(backendItem);
      if(result?.registration?.backendId)item.backendId=result.registration.backendId;
      backendSaved=true;
    }catch(apiError){
      if(!backendFallbackAllowed(apiError)){
        $('#customerRegisterMsg').textContent=backendApiErrorMessage(apiError,'Registration could not be saved.');
        toast(backendApiErrorMessage(apiError,'Registration could not be saved.'));
        return;
      }
    }
  }
  if(!backendSaved&&demoFallbackEnabled()){const list=pendingCustomers();list.push(item);savePendingCustomers(list)}
  state.bmiReportPreview=null;$('#postRegisterMenu')?.classList.add('hidden');
  showRegisterStep(1);openLoginPanel('customer');
  $('#customerLoginError').textContent=backendSaved?'Registration submitted securely. CEO/Admin can review it from any connected device.':'Registration saved in protected demo mode. CEO/Admin will review it on this device.';
  toast(backendSaved?'Registration request securely sent to CEO/Admin':'Registration saved in demo fallback');
}
$('#customerRegisterForm')?.addEventListener('submit',async e=>{e.preventDefault();if(Number(state.regStep||1)!==12){toast('Please finish all registration steps before sending.');return}await submitCustomerRegistration()});
document.addEventListener('click',async e=>{if(e.target.closest('[data-reg-step="12"] button[type="submit"]')){e.preventDefault();await submitCustomerRegistration()}});
document.addEventListener('click',e=>{
  if(e.target.closest('[data-select-recommended-package]')){e.preventDefault();selectRecommendedPackage();return}
  if(e.target.closest('[data-view-all-packages]')){e.preventDefault();$('#regMealPackage')?.focus();toast('You can choose another package, but CEO/Admin will review the final plan.')}
});
document.addEventListener('click',e=>{const btn=e.target.closest('.open-bmi-report');if(btn){e.preventDefault();openBmiReportModal(btn.dataset.reportSource,btn.dataset.reportIndex)}if(e.target.id==='bmiReportModal')e.target.classList.remove('open')});
function refreshCurrentView(){
  try{
    if(typeof restoreApprovedCustomers==='function')restoreApprovedCustomers();
    if(typeof ensureCustomerAccounts==='function')ensureCustomerAccounts();
    if(typeof normalizeCustomerCategories==='function')normalizeCustomerCategories();
    if(typeof normalizePendingCustomerCategories==='function')normalizePendingCustomerCategories();
    if(typeof closeCustomerActionMenus==='function')closeCustomerActionMenus();
    $('#notificationMenu')?.classList.remove('open');
    const detailOpen=document.querySelector('.customer-detail-workspace');
    const detailIndex=Number(selectedCustomerIndex);
    if(detailOpen&&Number.isFinite(detailIndex)&&customers[detailIndex]){
      openCustomerDetails(detailIndex);
    }else if(state.role==='customer'){
      renderPortal();
    }else{
      openModule(state.navModule||state.module||'dashboard');
    }
    toast('Page refreshed');
  }catch(error){
    console.error(error);
    location.reload();
  }
}
$('#refreshViewBtn')?.addEventListener('click',refreshCurrentView);
$('#logoutBtn')?.addEventListener('click',logoutAll);
bindProfileMenu();
$('#printBtn').addEventListener('click',()=>window.print());
$('#notificationBtn')?.addEventListener('click',e=>{e.stopPropagation();if(!canEdit()){toast('Only Boss/Admin can approve requests');return}$('#notificationMenu')?.classList.toggle('open')});document.addEventListener('click',e=>{const jump=e.target.closest?.('[data-notification-jump]');if(jump){openNotificationTarget(jump.dataset.notificationJump);return}if(!e.target.closest('#notificationWrap'))$('#notificationMenu')?.classList.remove('open')});updateRequestBadge();
$('#whatsappBtn')?.addEventListener('click',()=>openWhatsApp(contactNumbers.boss,'Hello Boss, I am checking Triangle Healthy Kitchen dashboard.'));
$('#instagramBtn')?.addEventListener('click',()=>toast('Instagram connected'));
$('#reviewBtn')?.addEventListener('click',()=>window.open('https://www.google.com/search?gs_ssp=eJzj4tVP1zc0LKsyNEopLis2YLRSNagwTjUxTTFMNDUyMzZMM0tKsTKoMDEySUkxSkm1MDNNTjZLMvaSKCnKTMxLz0lVyEhNzCnJqFTIzixJzkjNAwC1wRkk&q=triangle+healthy+kitchen&oq=triangle+&gs_lcrp=EgZjaHJvbWUqEggCEC4YJxivARjHARiABBiKBTIHCAAQABiPAjIHCAEQLhiABDISCAIQLhgnGK8BGMcBGIAEGIoFMgcIAxAAGIAEMgcIBBAAGIAEMgcIBRAAGIAEMgcIBhAAGIAEMgcIBxAAGIAEMgcICBAAGIAEMgcICRAAGI8C0gEINDExM2owajeoAgCwAgA&sourceid=chrome&ie=UTF-8#','_blank','noopener'));
cleanStoredTestData();seedDemoRegistrationFromUrl();restoreApprovedCustomers();ensureCustomerAccounts();normalizeCustomerCategories();normalizePendingCustomerCategories();setupLoginTabs();fillRegisterOptions();
renderDashboard();
applyRoleNav();
loadI18nFiles();

function registerIconSvg(key){
const icons={
user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.8-4 5-6 8-6s6.2 2 8 6"/></svg>',
boy:'<svg class="avatar-svg boy-avatar" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#dceeff"/><path d="M14 58c3.8-10 10-15 18-15s14.2 5 18 15" fill="#1769d1"/><path d="M21 27c0-9.5 4.8-15.5 11-15.5S43 17.5 43 27v5c0 7.5-4.8 13-11 13S21 39.5 21 32v-5Z" fill="#f4c7a0"/><path d="M18.5 27.5C18.5 15.8 24.4 8 32.4 8c8.9 0 14 7.3 13.1 19.5-3.7-1.2-7.3-3.3-10.8-6.4-4 4.2-9.3 6.4-16.2 6.4Z" fill="#172033"/><path d="M22 26c3.3-1 6.8-3.2 10.5-6.6 2.6 3.2 6 5.4 10.2 6.6" fill="none" stroke="#172033" stroke-width="3" stroke-linecap="round"/><circle cx="26.5" cy="32" r="1.7" fill="#102526"/><circle cx="37.5" cy="32" r="1.7" fill="#102526"/><path d="M28 38.5c2.3 1.7 5.7 1.7 8 0" stroke="#8a4b32" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M22.5 52h19l3 6H19.5l3-6Z" fill="#ffffff" opacity=".28"/></svg>',
girl:'<svg class="avatar-svg girl-avatar" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#ffe3ef"/><path d="M14 58c3.8-10 10-15 18-15s14.2 5 18 15" fill="#c43b7a"/><path d="M17 30c0-13.5 6.2-22 15-22s15 8.5 15 22c0 8.8-2.2 16-5.2 21.5H22.2C19.2 46 17 38.8 17 30Z" fill="#4a241b"/><path d="M22 28c0-9.2 4.4-15.2 10-15.2s10 6 10 15.2v4.2c0 7.3-4.5 12.8-10 12.8s-10-5.5-10-12.8V28Z" fill="#f2bd95"/><path d="M20.5 27.7C25 26.9 30 23.8 35.4 18.5c2.2 3.5 4.9 6.2 8.1 8.2-.6-9-5.1-15.2-11.4-15.2-6.7 0-11.2 6.5-11.6 16.2Z" fill="#4a241b"/><path d="M21.2 29c3.8-.8 8.4-3.8 13.8-9 2.2 3.7 5 6.5 8.2 8.3" fill="none" stroke="#4a241b" stroke-width="3" stroke-linecap="round"/><circle cx="27" cy="32.8" r="1.7" fill="#102526"/><circle cx="37" cy="32.8" r="1.7" fill="#102526"/><path d="M28 39.2c2.3 1.8 5.7 1.8 8 0" stroke="#8a4b32" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M22.5 52h19l3 6H19.5l3-6Z" fill="#ffffff" opacity=".28"/></svg>',
calendar:'<svg viewBox="0 0 24 24"><path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z"/></svg>',
height:'<svg viewBox="0 0 24 24"><path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/></svg>',
weight:'<svg viewBox="0 0 24 24"><path d="M8 8a4 4 0 0 1 8 0M6 8h12l2 12H4L6 8Z"/><path d="M12 8v4"/></svg>',
lose:'<svg viewBox="0 0 24 24"><path d="M7 3h10l2 18H5L7 3Z"/><path d="M10 8h4M12 6v4"/></svg>',
muscle:'<svg viewBox="0 0 24 24"><path d="M4 12h3M17 12h3M7 8v8M17 8v8M10 6v12M14 6v12"/></svg>',
bag:'<svg viewBox="0 0 24 24"><path d="M7 8h10v12H7V8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
leaf:'<svg viewBox="0 0 24 24"><path d="M20 4C12 4 6 9 6 17c7 0 12-5 14-13Z"/><path d="M6 17 4 21M7 16c3-4 7-7 13-12"/></svg>',
sofa:'<svg viewBox="0 0 24 24"><path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M4 11h16v6H4zM6 17v3M18 17v3"/></svg>',
walk:'<svg viewBox="0 0 24 24"><circle cx="13" cy="4" r="2"/><path d="M11 8 8 12l3 2 1 7M13 8l3 4 3 1M12 14l4 7"/></svg>',
run:'<svg viewBox="0 0 24 24"><circle cx="15" cy="4" r="2"/><path d="M13 8 9 12l4 2-2 7M14 9l3 3 3-1M13 14l5 7"/></svg>',
barbell:'<svg viewBox="0 0 24 24"><path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/></svg>',
star:'<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>',
egg:'<svg viewBox="0 0 24 24"><path d="M12 3c4 4 6 8 6 12a6 6 0 0 1-12 0c0-4 2-8 6-12Z"/></svg>',
dairy:'<svg viewBox="0 0 24 24"><path d="M9 3h6l-1 4 3 3v11H7V10l3-3-1-4Z"/><path d="M9 14h6"/></svg>',
nuts:'<svg viewBox="0 0 24 24"><path d="M8 13c-3-3-2-7 1-9 2 3 6 4 7 8 1 5-5 9-8 1Z"/><path d="M13 9c-4 2-5 5-6 9"/></svg>',
peanut:'<svg viewBox="0 0 24 24"><path d="M10 3c3 0 4 3 3 5 4 1 5 6 2 9-3 3-9 1-9-4 0-2 1-3 2-4-1-3 0-6 2-6Z"/></svg>',
seafood:'<svg viewBox="0 0 24 24"><path d="M4 12c3-4 7-5 12-2l4-3v10l-4-3c-5 3-9 2-12-2Z"/><circle cx="10" cy="11" r="1"/></svg>',
gluten:'<svg viewBox="0 0 24 24"><path d="M12 21V3M12 6c-4 1-5 3-4 6 3 0 4-2 4-6ZM12 10c4 1 5 3 4 6-3 0-4-2-4-6Z"/></svg>',
onion:'<svg viewBox="0 0 24 24"><path d="M12 4c4 4 7 7 7 11a7 7 0 0 1-14 0c0-4 3-7 7-11Z"/><path d="M12 4V2M9 12c1 2 1 4 0 6"/></svg>',
garlic:'<svg viewBox="0 0 24 24"><path d="M12 4c5 4 7 7 7 11a7 7 0 0 1-14 0c0-4 2-7 7-11Z"/><path d="M8 13c2 1 3 3 3 6M16 13c-2 1-3 3-3 6"/></svg>',
spicy:'<svg viewBox="0 0 24 24"><path d="M6 17c6-1 11-6 11-13 4 5 0 15-8 16-3 .4-4-1-3-3Z"/><path d="M16 4c1-1 2-1 3 0"/></svg>',
mushroom:'<svg viewBox="0 0 24 24"><path d="M4 11a8 8 0 0 1 16 0H4Z"/><path d="M9 11v7h6v-7"/></svg>',
cheese:'<svg viewBox="0 0 24 24"><path d="m4 15 16-8v12H4v-4Z"/><circle cx="14" cy="14" r="1"/><circle cx="18" cy="16" r="1"/></svg>',
coriander:'<svg viewBox="0 0 24 24"><path d="M12 21V8M7 12c-3-3-1-6 3-6 0 4-1 6-3 6ZM17 12c3-3 1-6-3-6 0 4 1 6 3 6Z"/></svg>',
capsicum:'<svg viewBox="0 0 24 24"><path d="M9 7c0-3 6-3 6 0 4 1 5 5 3 9-2 5-10 5-12 0-2-4-1-8 3-9Z"/><path d="M12 7V3"/></svg>',
corn:'<svg viewBox="0 0 24 24"><path d="M12 3c4 4 5 11 0 18-5-7-4-14 0-18Z"/><path d="M9 9h6M8 13h8M9 17h6"/></svg>',
eggplant:'<svg viewBox="0 0 24 24"><path d="M9 7c5 0 9 4 9 9a5 5 0 0 1-5 5c-5 0-9-4-9-9a5 5 0 0 1 5-5Z"/><path d="M9 7 7 3M9 7h4"/></svg>',
tomato:'<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7"/><path d="M12 6V3M9 7 7 4M15 7l2-3"/></svg>',
olives:'<svg viewBox="0 0 24 24"><ellipse cx="10" cy="13" rx="4" ry="6"/><ellipse cx="15" cy="11" rx="4" ry="6"/></svg>',
mint:'<svg viewBox="0 0 24 24"><path d="M12 21V9"/><path d="M12 12C7 12 5 9 5 5c5 0 7 3 7 7ZM12 15c5 0 7-3 7-7-5 0-7 3-7 7Z"/></svg>',
salad:'<svg viewBox="0 0 24 24"><path d="M5 12h14l-2 8H7l-2-8Z"/><path d="M8 12c0-4 3-6 6-3 2-3 5-1 5 3"/></svg>',
bread:'<svg viewBox="0 0 24 24"><path d="M5 11c0-4 3-7 7-7s7 3 7 7v8H5v-8Z"/></svg>',
avocado:'<svg viewBox="0 0 24 24"><path d="M12 3c5 4 7 8 5 13a6 6 0 0 1-10 0C5 11 7 7 12 3Z"/><circle cx="12" cy="14" r="2"/></svg>',
home:'<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/></svg>',
office:'<svg viewBox="0 0 24 24"><path d="M5 21V4h14v17"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
gym:'<svg viewBox="0 0 24 24"><path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/></svg>',
diabetes:'<svg viewBox="0 0 24 24"><path d="M12 3c4 5 6 8 6 12a6 6 0 0 1-12 0c0-4 2-7 6-12Z"/></svg>',
heart:'<svg viewBox="0 0 24 24"><path d="M12 21S4 16 4 9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 7-6 12-6 12Z"/></svg>',
butterfly:'<svg viewBox="0 0 24 24"><path d="M12 12C6 4 2 7 4 13c2 5 6 3 8-1ZM12 12c6-8 10-5 8 1-2 5-6 3-8-1ZM12 12v8"/></svg>'
};
return icons[key]||icons.leaf;
}
function registerIconKey(label,section){const t=label.toLowerCase();
if(t.includes('boy'))return 'boy'; if(t.includes('girl'))return 'girl';
if(t.includes('lose'))return 'lose'; if(t.includes('build'))return 'muscle'; if(t.includes('maintain'))return 'bag'; if(t.includes('eat healthy'))return 'leaf';
if(t.includes('sedentary'))return 'sofa'; if(t.includes('lightly'))return 'walk'; if(t==='active'||t.includes('moderate'))return 'run'; if(t.includes('very active'))return 'barbell'; if(t.includes('athlete'))return 'star';
if(t.includes('eggs'))return 'egg'; if(t.includes('dairy')||t.includes('lactose'))return 'dairy'; if(t.includes('nuts'))return 'nuts'; if(t.includes('peanuts'))return 'peanut'; if(t.includes('seafood')||t.includes('shellfish'))return 'seafood'; if(t.includes('gluten')||t.includes('wheat'))return 'gluten'; if(t.includes('soy'))return 'peanut';
if(t.includes('onion'))return 'onion'; if(t.includes('garlic'))return 'garlic'; if(t.includes('spicy'))return 'spicy'; if(t.includes('mushroom'))return 'mushroom'; if(t.includes('cheese'))return 'cheese'; if(t.includes('coriander'))return 'coriander'; if(t.includes('capsicum'))return 'capsicum'; if(t.includes('corn'))return 'corn'; if(t.includes('eggplant'))return 'eggplant'; if(t.includes('tomato'))return 'tomato'; if(t.includes('olives'))return 'olives'; if(t.includes('mint'))return 'mint';
if(t.includes('balanced'))return 'salad'; if(t.includes('high protein'))return 'barbell'; if(t.includes('low carb'))return 'bread'; if(t.includes('keto'))return 'avocado'; if(t.includes('vegetarian'))return 'leaf'; if(t.includes('vegan'))return 'leaf';
if(t.includes('home'))return 'home'; if(t.includes('office'))return 'office'; if(t.includes('gym'))return 'gym';
if(t.includes('diabetes'))return 'diabetes'; if(t.includes('hypertension')||t.includes('cholesterol'))return 'heart'; if(t.includes('thyroid'))return 'butterfly';
return 'leaf'}
function ensureRegisterBottomBack(){const form=$('#customerRegisterForm');if(!form)return;form.querySelectorAll('.register-step').forEach(step=>{const stepNo=Number(step.dataset.regStep||0);if(stepNo<=1||step.querySelector('.reg-bottom-back'))return;const action=step.querySelector('.reg-next,button[type="submit"]');if(!action)return;const row=document.createElement('div');row.className='reg-step-actions';const back=document.createElement('button');back.type='button';back.className='reg-bottom-back';back.textContent='Back';row.appendChild(back);action.parentNode.insertBefore(row,action);row.appendChild(action);});form.querySelectorAll('.reg-bottom-back').forEach(btn=>{if(btn.dataset.bound)return;btn.dataset.bound='yes';btn.addEventListener('click',()=>$('#regBack')?.click())})}
function enhanceRegisterIcons(){const form=$('#customerRegisterForm');if(!form)return;form.querySelectorAll('.choice-row,.mini-tile,.choice-card').forEach(card=>{if(card.querySelector('.reg-svg-icon')||(card.classList.contains('mini-tile')&&card.querySelector('.tile-icon')))return;const text=(card.querySelector('strong')?.textContent||card.querySelector('b')?.textContent||[...card.querySelectorAll('span')].find(s=>!s.classList.contains('reg-svg-icon'))?.textContent||card.textContent||'').trim();const icon=document.createElement('span');icon.className='reg-svg-icon';icon.innerHTML=registerIconSvg(registerIconKey(text));card.prepend(icon)});ensureRegisterBottomBack();}

setTimeout(enhanceRegisterIcons,80);
document.addEventListener('click',e=>{if(e.target.closest('[data-login-tab="register"],.reg-next,.reg-back'))setTimeout(enhanceRegisterIcons,80)});

setTimeout(ensureRegisterBottomBack,100);
document.addEventListener('click',e=>{if(e.target.closest('[data-login-tab="register"],.reg-next,.reg-back'))setTimeout(ensureRegisterBottomBack,80)});









// Premium shell icon pass v20260712-09
(function(){
  const icons={
    dashboard:'<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
    customers:'<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    subscriptions:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 16l2 2 4-4"/></svg>',
    mealplans:'<svg viewBox="0 0 24 24"><path d="M4 3v18"/><path d="M8 3v18"/><path d="M4 8h4"/><path d="M14 3v8a4 4 0 0 0 4 4h2"/><path d="M18 3v18"/></svg>',
    kitchen:'<svg viewBox="0 0 24 24"><path d="M6 2v8"/><path d="M10 2v8"/><path d="M8 2v20"/><path d="M16 2c2 2 3 4 3 7 0 4-2 6-3 7v6"/></svg>',
    delivery:'<svg viewBox="0 0 24 24"><path d="M10 17h4V5H2v12h3"/><path d="M14 17h1m3 0h4v-6l-3-4h-5"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
    packing:'<svg viewBox="0 0 24 24"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></svg>',
    drivers:'<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/><path d="M16 11l3 3"/><path d="M19 14l2-2"/></svg>',
    payments:'<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h5"/></svg>',
    reminders:'<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    reports:'<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 16v-5"/><path d="M12 16V7"/><path d="M17 16v-3"/></svg>',
    settings:'<svg viewBox="0 0 24 24"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82V22a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8.6 20a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.82-.33H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4 8.6c.16-.62-.02-1.28-.49-1.75l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.6 4.6c.62-.16 1.28.02 1.75.49V5a2 2 0 1 1 4 0v.09c.47-.47 1.13-.65 1.75-.49.62.16 1.28-.02 1.75-.49l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8.6c.16.62.65 1.11 1.27 1.27H22a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z"/></svg>'
  };
  function install(){
    document.querySelectorAll('.nav-item').forEach(btn=>{
      const span=btn.querySelector('span');
      const icon=icons[btn.dataset.module];
      if(span&&icon) span.innerHTML=icon;
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();

// Premium Customers module v20260712-09
function customerPremiumIcon(name){const icons={customers:'<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>',active:'<svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>',trial:'<svg viewBox="0 0 24 24"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>',paused:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M10 8v8M14 8v8"/></svg>',expired:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 14l6 4M15 14l-6 4"/></svg>',new:'<svg viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="9"/></svg>',search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>',filter:'<svg viewBox="0 0 24 24"><path d="M22 3H2l8 9.5V20l4 2v-9.5z"/></svg>',download:'<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',eye:'<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',more:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>',phone:'<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8 9.64a16 16 0 0 0 6.36 6.36l1.21-1.21a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92Z"/></svg>'};return icons[name]||icons.customers}
function customerInitials(name){return String(name||'TH').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'TH'}
function customerTrackingDate(){const input=$('#customerTrackingDate');if(input){if(!input.value)input.value=dashboardDate();return input.value||todayIso()}return dashboardDate()}
function customerStatusValue(c,referenceDate=customerTrackingDate()){const s=String(c.status||'Active');const t=trialStatusText(c);if(/paused/i.test(s))return 'Paused';if(validDateValue(c.subscriptionEnd)&&validDateValue(referenceDate)&&new Date(c.subscriptionEnd+'T12:00:00')<new Date(referenceDate+'T12:00:00'))return 'Expired';if(/expired/i.test(s))return 'Expired';if(/trial/i.test(t)||/trial/i.test(String(c.paymentStatus||'')))return 'Trial';if(/pending/i.test(s))return 'Pending';return 'Active'}
function statusBadgeHtml(status){const cls={Active:'good',Trial:'warn',Paused:'blue',Expired:'bad',Pending:'warn','Payment Uploaded':'blue',Rejected:'bad',Verified:'good'}[status]||'good';return '<span class="status-pill '+cls+'">'+escHtml(status)+'</span>'}
function customerEndText(c,referenceDate=customerTrackingDate()){if(!validDateValue(c.subscriptionEnd))return '<span class="muted-cell">Pending setup</span>';const track=new Date((referenceDate||todayIso())+'T12:00:00');const end=new Date(c.subscriptionEnd+'T12:00:00');const days=Math.ceil((end-track)/86400000);if(days<0)return displayDate(c.subscriptionEnd)+'<small class="end-red">Expired on selected date</small>';if(days===0)return displayDate(c.subscriptionEnd)+'<small class="end-red">Expires selected date</small>';if(days<=5)return displayDate(c.subscriptionEnd)+'<small class="end-orange">'+days+' days left</small>';return displayDate(c.subscriptionEnd)+'<small class="end-green">'+days+' days left</small>'}
 function customerSubscriptionDurationLabel(c){const payment=c.registrationPlanPayment||{};const duration=c.subscriptionDuration||payment.duration||'';if((c.journey||payment.journey)==='trial')return Number(c.trialDays||payment.trialDays||1)+' Day Trial';if(duration==='weekly')return '1 Week';if(duration==='twoWeeks')return '2 Weeks';if(duration==='monthly')return 'Monthly / 4 Weeks';return c.subscriptionType||'Standard'}
 function customerDeliveryDaysLabel(c){const payment=c.registrationPlanPayment||{};const days=Number(c.deliveryDays||payment.deliveryDays||packageDeliveryTotal(c)||0);const base=Number(payment.baseDeliveryDays||0);const selected=payment.selectedDeliveryDays||c.selectedDeliveryDays;const excluded=payment.excludedDays||c.excludedDays;const friday=customerHasFriday(c);if(base&&base!==days){const schedule=Array.isArray(selected)&&selected.length?selected.length+' delivery days/week':'custom schedule';return days+' packages ('+schedule+')'}return days?(days+' packages'+(friday?' including Friday':' excluding Friday')+(Array.isArray(excluded)&&excluded.length?' / no '+excluded.join(', '):'')):'Pending setup'}
 function customerAvatarHtml(c,i){return '<div class="cust-avatar tone-'+(i%6)+'">'+customerInitials(c.name)+'</div>'}
function customerPremiumKpi(icon,title,value,desc,tone,extra=''){return '<article class="customer-kpi '+tone+'"><span class="customer-kpi-icon">'+customerPremiumIcon(icon)+'</span><div><b>'+escHtml(title)+'</b><strong>'+escHtml(value)+'</strong><small>'+escHtml(desc)+'</small></div>'+extra+'</article>'}
function customerPremiumStats(){const track=customerTrackingDate();const total=customers.length;const active=customers.filter(c=>customerStatusValue(c,track)==='Active').length;const trial=customers.filter(c=>customerStatusValue(c,track)==='Trial').length;const paused=customers.filter(c=>customerStatusValue(c,track)==='Paused').length;const expired=customers.filter(c=>customerStatusValue(c,track)==='Expired').length;const newMonth=customers.filter(c=>String(c.trialDate||c.subscriptionStart||'').slice(0,7)===String(track).slice(0,7)).length;return '<div class="customer-kpi-row" id="customerKpiRow">'+customerPremiumKpi('customers','Total Customers',total,'All time','green')+customerPremiumKpi('active','Active Customers',active,'Active on '+displayDate(track),'green')+customerPremiumKpi('trial','Trial Customers',trial,'Trial on selected date','orange')+customerPremiumKpi('paused','Paused Customers',paused,'Paused on selected date','blue')+customerPremiumKpi('expired','Expired Customers',expired,'Expired by selected date','red')+customerPremiumKpi('new','New This Month',newMonth,'Registered in selected month','purple')+'</div>'}
function customerRegistrationDate(c){return String(c.createdAt||c.registeredAt||c.trialDate||c.subscriptionStart||'').slice(0,10)}
function customerIsExpiringSoon(c,referenceDate=customerTrackingDate()){if(!validDateValue(c.subscriptionEnd))return false;const track=new Date((referenceDate||todayIso())+'T12:00:00');const end=new Date(c.subscriptionEnd+'T12:00:00');const diff=Math.ceil((end-track)/86400000);return diff>=0&&diff<=5}
function customerAdvancedFiltersHtml(){
  const zoneOpts=Object.keys(qatarZones).map(z=>'<option value="'+escAttr(z)+'">'+escHtml(zoneShort(z)+' - '+zoneNameOnly(z))+'</option>').join('');
  const driverOpts=drivers.map(d=>'<option value="'+escAttr(d[0])+'">'+escHtml(d[0])+'</option>').join('');
  return '<div class="customer-advanced-filters" id="customerAdvancedFilters" hidden>'+
    '<label><span>Delivery Zone</span><select id="customerZoneFilter"><option value="All">All Zones</option>'+zoneOpts+'</select></label>'+
    '<label><span>Area</span><select id="customerAreaFilter"><option value="All">All Areas</option></select></label>'+
    '<label><span>Driver</span><select id="customerDriverFilter"><option value="All">All Drivers</option>'+driverOpts+'<option value="Unassigned">Unassigned</option></select></label>'+
    '<label><span>Payment Status</span><select id="customerPaymentFilter"><option value="All">All Payments</option><option>Paid</option><option>Pending</option><option>Payment Uploaded</option><option>Trial Day</option><option>Cash</option><option>Overdue</option></select></label>'+
    '<label><span>Expiring Soon</span><select id="customerExpiringFilter"><option value="All">All Customers</option><option value="soon">Expiring in 5 days</option></select></label>'+
    '<label><span>Registered From</span><input id="customerRegisteredFrom" type="date"></label>'+
    '<label><span>Registered To</span><input id="customerRegisteredTo" type="date"></label>'+
    '<button class="primary-btn light" id="customerClearFilters" type="button">Clear Filters</button>'+
  '</div>'
}
function refreshCustomerAreaFilter(){
  const zone=$('#customerZoneFilter')?.value||'All';
  const area=$('#customerAreaFilter');
  if(!area)return;
  const areas=zone==='All'?[...new Set(customers.map(c=>c.area).filter(Boolean))]:[...new Set(qatarZones[zone]||[])];
  const current=area.value;
  area.innerHTML='<option value="All">All Areas</option>'+areas.map(a=>'<option value="'+escAttr(a)+'">'+escHtml(a)+'</option>').join('');
  if([...area.options].some(o=>o.value===current))area.value=current;
}
function customerFilteredList(){
  let list=customers.slice();
  const q=String($('#customerPremiumSearch')?.value||'').toLowerCase().trim();
  const status=$('#customerStatusFilter')?.value||'All';
  const cat=$('#customerCategoryFilter')?.value||'All';
  const sub=$('#customerSubscriptionFilter')?.value||'All';
  const zone=$('#customerZoneFilter')?.value||'All';
  const area=$('#customerAreaFilter')?.value||'All';
  const driver=$('#customerDriverFilter')?.value||'All';
  const payment=$('#customerPaymentFilter')?.value||'All';
  const expiring=$('#customerExpiringFilter')?.value||'All';
  const from=$('#customerRegisteredFrom')?.value||'';
  const to=$('#customerRegisteredTo')?.value||'';
  if(q)list=list.filter(c=>String((c.name||'')+' '+(c.phone||'')+' '+(c.area||'')+' '+(c.plan||'')+' '+zoneShort(c.zone)).toLowerCase().includes(q));
  if(status!=='All')list=list.filter(c=>customerStatusValue(c)===status);
  if(cat!=='All')list=list.filter(c=>String(c.cat||'')===cat);
  if(sub!=='All')list=list.filter(c=>String(c.mealPackageId||'3m1s')===sub);
  if(zone!=='All')list=list.filter(c=>String(c.zone||'')===zone);
  if(area!=='All')list=list.filter(c=>String(c.area||'')===area);
  if(driver!=='All')list=list.filter(c=>String(customerDriver(c)||'Unassigned')===driver);
  if(payment!=='All')list=list.filter(c=>{const text=String(paymentStatusText(c)||'').toLowerCase();if(payment==='Payment Uploaded')return /uploaded|proof/.test(text);if(payment==='Cash')return /cash/.test(text+' '+String(c.payment?.method||'').toLowerCase());if(payment==='Overdue')return /overdue/.test(text);return text.includes(payment.toLowerCase())});
  if(expiring==='soon')list=list.filter(c=>customerIsExpiringSoon(c,customerTrackingDate()));
  if(from)list=list.filter(c=>customerRegistrationDate(c)&&customerRegistrationDate(c)>=from);
  if(to)list=list.filter(c=>customerRegistrationDate(c)&&customerRegistrationDate(c)<=to);
  return list;
}
const customerPagination={page:1,pageSize:50};
function customerProgressCell(c){const p=packageProgress(c);const tone=/paused/i.test(c.status||'')?' paused':p.remaining<=0?' complete':'';return '<div class="customer-progress-cell'+tone+'"><strong>'+p.received+'/'+p.total+'</strong><i><b style="width:'+Math.max(0,Math.min(100,p.percent))+'%"></b></i></div>'}
function premiumCustomerRows(list,startIndex=0){return list.map((c,idx)=>{const realIndex=customers.indexOf(c);const status=customerStatusValue(c);const catIndex=Math.max(0,mealCategories.findIndex(x=>x[0]===c.cat));const pkg=packageById(c.mealPackageId||'3m1s');return '<tr><td><input type="checkbox" class="customer-row-check"></td><td>'+(startIndex+idx+1)+'</td><td><div class="customer-person">'+customerAvatarHtml(c,idx)+'<div><b>'+escHtml(c.name||'-')+'</b><small>THK-2026-'+String(realIndex+1).padStart(4,'0')+'</small></div></div></td><td><div class="contact-cell"><span class="mini-svg">'+customerPremiumIcon('phone')+'</span>'+escHtml(c.phone||'-')+'<span class="wa-dot">WA</span></div></td><td><div class="category-cell">'+badge(c.cat||'A',catIndex)+'<span>'+escHtml((mealCategoryRow(c.cat)||['','-','-'])[1])+'P / '+escHtml((mealCategoryRow(c.cat)||['','-','-'])[2])+'C</span></div></td><td><b>'+escHtml(c.plan||packagePlanName(c.mealPackageId))+'</b><small>'+escHtml(pkg.label||'-')+'</small></td><td>'+statusBadgeHtml(status)+'</td><td>'+customerEndText(c)+'</td><td>'+customerProgressCell(c)+'</td><td>'+escHtml(customerDriver(c)||'-')+'</td><td><div class="customer-actions"><button type="button" class="icon-btn customer-view" data-name="'+escAttr(c.name)+'" title="View customer">'+customerPremiumIcon('eye')+'</button><button type="button" class="icon-btn customer-more" data-customer-index="'+realIndex+'" title="More actions" aria-haspopup="menu">'+customerPremiumIcon('more')+'</button></div></td></tr>'}).join('')}
function customerPageNumbers(page,totalPages){const pages=[];const add=p=>{if(p>=1&&p<=totalPages&&!pages.includes(p))pages.push(p)};add(1);add(page-1);add(page);add(page+1);add(totalPages);pages.sort((a,b)=>a-b);let last=0;return pages.map(p=>{const gap=p-last>1?'<span>...</span>':'';last=p;return gap+'<button class="page-chip '+(p===page?'active':'')+'" type="button" data-customer-page="'+p+'">'+p+'</button>'}).join('')}
function customerPaginationHtml(total){const size=customerPagination.pageSize;const totalPages=Math.max(1,Math.ceil(total/size));const page=Math.min(Math.max(1,customerPagination.page),totalPages);customerPagination.page=page;const start=total?(page-1)*size+1:0;const end=Math.min(total,page*size);const atStart=page===1,atEnd=page===totalPages;return '<span id="customerResultCount">Showing '+start+' to '+end+' of '+total+' results</span><div><button class="icon-btn" type="button" data-customer-page="first" title="'+(atStart?'Already on first page':'First page')+'" aria-label="First page" '+(atStart?'disabled':'')+'>&laquo;</button><button class="icon-btn" type="button" data-customer-page="prev" title="'+(atStart?'No previous page':'Previous page')+'" aria-label="Previous page" '+(atStart?'disabled':'')+'>&lsaquo;</button>'+customerPageNumbers(page,totalPages)+'<button class="icon-btn" type="button" data-customer-page="next" title="'+(atEnd?'No next page':'Next page')+'" aria-label="Next page" '+(atEnd?'disabled':'')+'>&rsaquo;</button><button class="icon-btn" type="button" data-customer-page="last" title="'+(atEnd?'Already on last page':'Last page')+'" aria-label="Last page" '+(atEnd?'disabled':'')+'>&raquo;</button><select id="customerPageSize" aria-label="Customers per page"><option value="50" '+(size===50?'selected':'')+'>50 / page</option><option value="25" '+(size===25?'selected':'')+'>25 / page</option><option value="10" '+(size===10?'selected':'')+'>10 / page</option><option value="100" '+(size===100?'selected':'')+'>100 / page</option></select></div>'}
function applyCustomerFilters(resetPage=false){if(resetPage)customerPagination.page=1;const list=customerFilteredList();const totalPages=Math.max(1,Math.ceil(list.length/customerPagination.pageSize));customerPagination.page=Math.min(Math.max(1,customerPagination.page),totalPages);const start=(customerPagination.page-1)*customerPagination.pageSize;const pageRows=list.slice(start,start+customerPagination.pageSize);const kpis=$('#customerKpiRow');if(kpis){const fresh=document.createElement('div');fresh.innerHTML=customerPremiumStats();const next=fresh.firstElementChild;if(next)kpis.replaceWith(next)}const body=$('#customerPremiumTableBody');if(body)body.innerHTML=premiumCustomerRows(pageRows,start);const pager=$('#customerPagination');if(pager)pager.innerHTML=customerPaginationHtml(list.length);bindCustomerButtons(canEdit());bindCustomerPaginationControls()}
function customerPremiumFilters(){const firstPage=customers.slice(0,customerPagination.pageSize);return '<section class="customer-table-card"><div class="customer-filter-row has-advanced"><label class="customer-search"><span>'+customerPremiumIcon('search')+'</span><input id="customerPremiumSearch" placeholder="Search by name, phone, area or ID..."></label><label><span>Status</span><select id="customerStatusFilter"><option value="All">All Status</option><option>Active</option><option>Trial</option><option>Paused</option><option>Expired</option><option>Pending</option></select></label><label><span>Category</span><select id="customerCategoryFilter"><option value="All">All Categories</option>'+mealCategories.map(c=>'<option value="'+c[0]+'">Category '+c[0]+'</option>').join('')+'</select></label><label><span>Subscription</span><select id="customerSubscriptionFilter"><option value="All">All Plans</option>'+mealSelectionPackages.map(p=>'<option value="'+p.id+'">'+escHtml(p.label)+'</option>').join('')+'</select></label><button class="primary-btn light customer-filter-toggle" id="customerFilterBtn" type="button" aria-expanded="false" aria-controls="customerAdvancedFilters"><span class="btn-icon">'+customerPremiumIcon('filter')+'</span>Filters</button><label class="customer-tracking-date"><span>Tracking Date</span><input id="customerTrackingDate" type="date" value="'+escAttr(dashboardDate())+'"></label></div>'+customerAdvancedFiltersHtml()+'<div class="premium-customer-table"><table><thead><tr><th><input type="checkbox" id="selectAllCustomers"></th><th>#</th><th>Customer</th><th>Contact</th><th>Category</th><th>Subscription Plan</th><th>Status</th><th>Subscription End</th><th>Progress</th><th>Assigned Driver</th><th>Actions</th></tr></thead><tbody id="customerPremiumTableBody">'+premiumCustomerRows(firstPage,0)+'</tbody></table></div><div class="customer-pagination" id="customerPagination">'+customerPaginationHtml(customers.length)+'</div></section>'}
function bindCustomerPaginationControls(){
  document.querySelectorAll('[data-customer-page]').forEach(btn=>btn.addEventListener('click',()=>{
    const list=customerFilteredList();
    const totalPages=Math.max(1,Math.ceil(list.length/customerPagination.pageSize));
    const action=btn.dataset.customerPage;
    if(action==='first')customerPagination.page=1;
    else if(action==='prev')customerPagination.page=Math.max(1,customerPagination.page-1);
    else if(action==='next')customerPagination.page=Math.min(totalPages,customerPagination.page+1);
    else if(action==='last')customerPagination.page=totalPages;
    else customerPagination.page=Number(action)||1;
    applyCustomerFilters(false);
  }));
  $('#customerPageSize')?.addEventListener('change',e=>{
    customerPagination.pageSize=Number(e.target.value)||50;
    customerPagination.page=1;
    applyCustomerFilters(false);
  });
}
function bindCustomerPremiumFilters(){
  ['#customerPremiumSearch','#customerStatusFilter','#customerCategoryFilter','#customerSubscriptionFilter','#customerTrackingDate','#customerZoneFilter','#customerAreaFilter','#customerDriverFilter','#customerPaymentFilter','#customerExpiringFilter','#customerRegisteredFrom','#customerRegisteredTo'].forEach(sel=>$(sel)?.addEventListener('input',()=>applyCustomerFilters(true)));
  ['#customerStatusFilter','#customerCategoryFilter','#customerSubscriptionFilter','#customerTrackingDate','#customerAreaFilter','#customerDriverFilter','#customerPaymentFilter','#customerExpiringFilter','#customerRegisteredFrom','#customerRegisteredTo'].forEach(sel=>$(sel)?.addEventListener('change',()=>applyCustomerFilters(true)));
  $('#customerZoneFilter')?.addEventListener('change',()=>{refreshCustomerAreaFilter();applyCustomerFilters(true)});
  $('#customerFilterBtn')?.addEventListener('click',()=>{const panel=$('#customerAdvancedFilters');const btn=$('#customerFilterBtn');if(!panel||!btn)return;panel.hidden=!panel.hidden;btn.classList.toggle('active-filter',!panel.hidden);btn.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)refreshCustomerAreaFilter()});
  $('#customerClearFilters')?.addEventListener('click',()=>{['customerZoneFilter','customerAreaFilter','customerDriverFilter','customerPaymentFilter','customerExpiringFilter'].forEach(id=>{const el=$('#'+id);if(el)el.value='All'});['customerRegisteredFrom','customerRegisteredTo'].forEach(id=>{const el=$('#'+id);if(el)el.value=''});refreshCustomerAreaFilter();applyCustomerFilters(true)});
  refreshCustomerAreaFilter();
  bindCustomerPaginationControls();
}
function renderCustomers(){state.module='customers';const editable=canEdit();const header='<section class="customer-premium-head"><div><h1>Customers</h1><p>Dashboard <span>&rsaquo;</span> Customers</p></div><div class="customer-page-actions"><button class="primary-btn light" type="button">'+displayDate(dashboardDate())+'</button><button class="primary-btn green" type="button" id="addNewCustomerBtn">+ Add New Customer</button></div></section>';moduleFrame('Customers','',header+customerPremiumStats()+customerPremiumFilters()+'<section class="panel" id="pauseRequestSection" style="margin-top:14px"><div class="panel-header"><div><h2>Pending Pause / Resume Requests</h2><span class="sub">Approve or decline customer portal requests.</span></div></div>'+pauseRequestsRows()+'</section><section class="panel" id="pendingCustomerSection" style="margin-top:14px"><div class="panel-header"><div><h2>Pending Customer Registrations</h2><span class="sub">New signup requests waiting for CEO/Admin approval.</span></div></div>'+pendingCustomerRows()+'<div id="pendingReviewBox" class="pending-review-wrap"></div></section><section class="panel customer-details-panel" id="customerDetailsSection" style="margin-top:14px"><div class="panel-header"><h2>Customer Details</h2><span class="sub">'+(editable?'CEO/Admin edit enabled':'View only')+'</span></div><div id="customerDetailBox">'+customerForm(customers[selectedCustomerIndex],editable)+'</div></section>');bindCustomerPremiumFilters();$('#addNewCustomerBtn')?.addEventListener('click',()=>{logoutAll();openLoginPanel('register')});$('#selectAllCustomers')?.addEventListener('change',e=>document.querySelectorAll('.customer-row-check').forEach(x=>x.checked=e.target.checked));bindCustomerButtons(editable);bindZoneArea(document);bindWeekPackageActions();$('#detailMealPackage')?.addEventListener('change',refreshWeekPlannerForPackage);$('#detailIncludeFriday')?.addEventListener('change',refreshWeekPlannerForPackage);bindPendingApprovals();bindPauseApprovals();bindAdjustmentActions(editable);bindDirectPauseActions(editable);if(state.focusApprovals){const target=state.focusApprovals==='pauses'?'#pauseRequestSection':'#pendingCustomerSection';state.focusApprovals=false;setTimeout(()=>document.querySelector(target)?.scrollIntoView({behavior:'smooth',block:'start'}),80)}}

// Premium top navigation aliases and icons v20260712-10
var premiumNavAliases={customerreview:'customers',nutritionplans:'mealplans',deliveries:'delivery',team:'drivers'};
function resolvePremiumModule(module){return premiumNavAliases[module]||module}
function canOpen(module){const r=roles[state.role];const actual=resolvePremiumModule(module);return !!r&&(r.allow==='all'||r.allow.includes(actual)||r.allow.includes(module))}
function premiumActiveModule(){return state.navModule||state.module}
function moduleFrame(title,sub,body){$('#pageTitle').textContent=title;$('#workspace').innerHTML=body;document.body.classList.toggle('customer-mode',state.role==='customer');const active=premiumActiveModule();document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.module===active));applyRoleNav();updateSidebarStats();updateRequestBadge();applyI18n()}
function openModule(module){const actual=resolvePremiumModule(module);if(!canOpen(module)){locked(module);return}state.navModule=module;if(module==='customerreview')state.focusApprovals='registrations';({dashboard:renderDashboard,portal:renderPortal,customers:renderCustomers,subscriptions:renderSubscriptions,mealplans:renderMealPlans,kitchen:renderKitchen,packing:renderPacking,delivery:renderDelivery,drivers:renderDrivers,payments:renderPayments,reminders:renderReminders,reports:renderReports,settings:renderSettings}[actual]||renderDashboard)()}
function applyRoleNav(){const r=roles[state.role];if(!r)return;document.body.classList.toggle('customer-mode',state.role==='customer');const name=$('#accountName');const roleText=$('#accountRoleText');const avatar=document.querySelector('.profile-avatar');if(name)name.textContent=r.label;if(roleText)roleText.textContent=r.hint||r.label;if(avatar)avatar.textContent=profileInitials(r.label);syncProfileMenu();document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('locked',!canOpen(b.dataset.module)))}
function installPremiumNavIcons(){
  const icons={
    dashboard:'<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
    customers:'<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>',
    customerreview:'<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    nutritionplans:'<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M9 7h6M9 11h7M9 15h4"/></svg>',
    subscriptions:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 16l2 2 4-4"/></svg>',
    deliveries:'<svg viewBox="0 0 24 24"><path d="M10 17h4V5H2v12h3"/><path d="M14 17h1m3 0h4v-6l-3-4h-5"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
    payments:'<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M7 15h4"/></svg>',
    reports:'<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 16v-5"/><path d="M12 16V7"/><path d="M17 16v-3"/></svg>',
    team:'<svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 11a3 3 0 1 0 0-6"/><path d="M21 21v-2a4 4 0 0 0-3-3.46"/></svg>',
    settings:'<svg viewBox="0 0 24 24"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82V22a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8.6 20a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.82-.33H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4 8.6c.16-.62-.02-1.28-.49-1.75l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.6 4.6c.62-.16 1.28.02 1.75.49V5a2 2 0 1 1 4 0v.09c.47-.47 1.13-.65 1.75-.49.62.16 1.28-.02 1.75-.49l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8.6c.16.62.65 1.11 1.27 1.27H22a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z"/></svg>'
  };
  document.querySelectorAll('.nav-item').forEach(btn=>{const span=btn.querySelector('span');if(span&&icons[btn.dataset.module])span.innerHTML=icons[btn.dataset.module]});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installPremiumNavIcons);else installPremiumNavIcons();

// Customer Review workflow moved out of Customers v20260712-15
function pendingReviewStats(){
  const list=pendingCustomers();
  const uploaded=list.filter(p=>/uploaded|proof/i.test(String(p.payment?.status||p.paymentStatus||''))).length;
  const nutrition=list.filter(p=>/pending/i.test(String(p.health?.nutrition?.nutritionStatus||p.health?.nutrition?.status||'Pending'))).length;
  const allergies=list.filter(p=>(p.allergies||[]).filter(x=>x&&x!=='None').length).length;
  return '<div class="customer-kpi-row review-kpi-row">'+
    customerPremiumKpi('new','New Registrations',list.length,'Waiting for CEO/Admin review','orange')+
    customerPremiumKpi('customers','Nutrition Review',nutrition,'Need nutrition approval','blue')+
    customerPremiumKpi('active','Payment Uploaded',uploaded,'Proof needs verification','green')+
    customerPremiumKpi('expired','Allergy Alerts',allergies,'Customers with allergy notes','red')+
  '</div>';
}
function pendingReviewRows(list){
  if(!list.length)return '<tr><td colspan="10"><div class="review-empty-state"><h2>No pending registrations</h2><p>New customer registrations will appear here for review and nutrition approval.</p></div></td></tr>';
  return list.map((p,i)=>{
    const h=p.health||{};
    const n=h.nutrition||{};
    const cat=p.cat||n.assignedCategory||'Pending';
    const catRow=mealCategoryRow(cat);
    const status=String(p.status||'Pending Approval');
    const registered=p.createdAt||p.registeredAt||p.payment?.uploadedDate||new Date().toISOString().slice(0,10);
    return '<tr>'+
      '<td><input type="checkbox" class="customer-row-check"></td>'+
      '<td>'+(i+1)+'</td>'+
      '<td><div class="customer-person">'+customerAvatarHtml({name:p.name},i)+'<div><b>'+adminCustomerValue(p.name||'-')+'</b><small>Pending registration</small></div></div></td>'+
      '<td><div class="contact-cell"><span class="mini-svg">'+customerPremiumIcon('phone')+'</span>'+escHtml(p.phone||'-')+'<span class="wa-dot">WA</span></div></td>'+
      '<td>'+adminCustomerValue(p.goal||'-')+'<small>'+escHtml(h.bmi?('BMI '+h.bmi):'BMI pending')+'</small></td>'+
      '<td><div class="category-cell">'+badge(cat,Math.max(0,mealCategories.findIndex(x=>x[0]===cat)))+'<span>'+escHtml((catRow||['','-','-'])[1])+'P / '+escHtml((catRow||['','-','-'])[2])+'C</span></div></td>'+
      '<td><b>'+escHtml(p.plan||packagePlanName(p.mealPackageId))+'</b><small>'+escHtml(packageById(p.mealPackageId||'3m1s').label||'-')+'</small></td>'+
      '<td>'+statusBadgeHtml(status==='Pending'?'Pending':status)+'</td>'+
      '<td>'+escHtml(displayDate(String(registered).slice(0,10)))+'</td>'+
      '<td><div class="customer-actions"><button type="button" class="icon-btn review-detail-eye" data-pending-index="'+i+'" title="Open review">'+customerPremiumIcon('eye')+'</button><button type="button" class="icon-btn" title="More actions">'+customerPremiumIcon('more')+'</button></div></td>'+
    '</tr>';
  }).join('');
}
function applyPendingReviewFilters(){
  let list=pendingCustomers();
  const q=String($('#reviewSearch')?.value||'').toLowerCase().trim();
  const status=$('#reviewStatusFilter')?.value||'All';
  const cat=$('#reviewCategoryFilter')?.value||'All';
  if(q)list=list.filter(p=>String((p.name||'')+' '+(p.phone||'')+' '+(p.area||'')+' '+(p.goal||'')).toLowerCase().includes(q));
  if(status!=='All')list=list.filter(p=>String(p.status||'Pending Approval')===status);
  if(cat!=='All')list=list.filter(p=>String(p.cat||p.health?.nutrition?.assignedCategory||'')===cat);
  const body=$('#pendingReviewTableBody');
  if(body)body.innerHTML=pendingReviewRows(list);
  const result=$('#reviewResultCount');
  if(result)result.textContent='Showing '+list.length+' pending registration'+(list.length===1?'':'s');
  bindCustomerReviewActions();
}
function customerReviewFilters(){
  return '<section class="customer-table-card review-table-card"><div class="customer-filter-row review-filter-row">'+
    '<label class="customer-search"><span>'+customerPremiumIcon('search')+'</span><input id="reviewSearch" placeholder="Search by name, phone, goal or area..."></label>'+
    '<label><span>Status</span><select id="reviewStatusFilter"><option value="All">All Status</option><option>Pending Approval</option><option>Pending</option></select></label>'+
    '<label><span>Category</span><select id="reviewCategoryFilter"><option value="All">All Categories</option>'+mealCategories.map(c=>'<option value="'+c[0]+'">Category '+c[0]+'</option>').join('')+'</select></label>'+
    '<label><span>Source</span><select><option>All Sources</option><option>Website</option><option>WhatsApp</option><option>Admin</option></select></label>'+
    '<button class="primary-btn light" id="reviewFilterBtn" type="button"><span class="btn-icon">'+customerPremiumIcon('filter')+'</span>Filters</button>'+
    '<button class="primary-btn light" id="reviewExportBtn" type="button"><span class="btn-icon">'+customerPremiumIcon('download')+'</span>Export</button>'+
  '</div><div class="premium-customer-table"><table><thead><tr><th><input type="checkbox" id="selectAllReviews"></th><th>#</th><th>Customer</th><th>Contact</th><th>Goal / BMI</th><th>Category</th><th>Package</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead><tbody id="pendingReviewTableBody">'+pendingReviewRows(pendingCustomers())+'</tbody></table></div><div class="customer-pagination"><span id="reviewResultCount">Showing '+pendingCustomers().length+' pending registration'+(pendingCustomers().length===1?'':'s')+'</span><div><button class="page-chip active">1</button><select><option>10 / page</option><option>25 / page</option></select></div></div></section>';
}
function renderCustomerReview(){
  state.module='customerreview';
  state.navModule='customerreview';
  const header='<section class="customer-premium-head"><div><h1>Customer Review</h1><p>Dashboard <span>&rsaquo;</span> Customer Review</p></div><div class="customer-page-actions"><button class="primary-btn light" type="button">'+displayDate(dashboardDate())+'</button><button class="primary-btn green" type="button" onclick="logoutAll();openLoginPanel(\'register\')">+ Add New Registration</button></div></section>';
  moduleFrame('Customer Review','',header+pendingReviewStats()+customerReviewFilters());
  ['#reviewSearch','#reviewStatusFilter','#reviewCategoryFilter'].forEach(sel=>$(sel)?.addEventListener('input',applyPendingReviewFilters));
  ['#reviewStatusFilter','#reviewCategoryFilter'].forEach(sel=>$(sel)?.addEventListener('change',applyPendingReviewFilters));
  $('#reviewFilterBtn')?.addEventListener('click',applyPendingReviewFilters);
  $('#reviewExportBtn')?.addEventListener('click',()=>toast('Customer review export will use this filtered list when backend export is connected.'));
  $('#selectAllReviews')?.addEventListener('change',e=>document.querySelectorAll('.customer-row-check').forEach(x=>x.checked=e.target.checked));
  bindCustomerReviewActions();
}
function openCustomerReviewDetail(index){
  const list=pendingCustomers();
  const p=list[Number(index)];
  if(!p){toast('Pending customer not found');renderCustomerReview();return}
  state.module='customerreview';
  state.navModule='customerreview';
  moduleFrame('Customer Review','',pendingReviewHtml(p,Number(index)));
  bindPendingApprovals();
  $('#backPendingList')?.addEventListener('click',renderCustomerReview);
}
function bindCustomerReviewActions(){
  document.querySelectorAll('.review-detail-eye').forEach(btn=>btn.addEventListener('click',()=>openCustomerReviewDetail(btn.dataset.pendingIndex)));
}

renderCustomers=function(){
  state.module='customers';
  state.navModule='customers';
  customerPagination.page=1;
  const editable=canEdit();
  const header='<section class="customer-premium-head"><div><h1>Customers</h1><p>Dashboard <span>&rsaquo;</span> Customers</p></div><div class="customer-page-actions"><button class="primary-btn green" type="button" id="addNewCustomerBtn">+ Add New Customer</button></div></section>';
  moduleFrame('Customers','',header+customerPremiumStats()+customerPremiumFilters()+'<section class="panel" id="pauseRequestSection" style="margin-top:14px"><div class="panel-header"><div><h2>Pending Pause / Resume Requests</h2><span class="sub">Approve or decline customer portal requests.</span></div></div>'+pauseRequestsRows()+'</section>');
  bindCustomerPremiumFilters();
  $('#addNewCustomerBtn')?.addEventListener('click',()=>{logoutAll();openLoginPanel('register')});
  $('#selectAllCustomers')?.addEventListener('change',e=>document.querySelectorAll('.customer-row-check').forEach(x=>x.checked=e.target.checked));
  bindCustomerButtons(editable);
  bindPauseApprovals();
  bindAdjustmentActions(editable);
  bindDirectPauseActions(editable);
  if(state.focusApprovals){
    const target=state.focusApprovals==='pauses'?'#pauseRequestSection':'';
    state.focusApprovals=false;
    if(target)setTimeout(()=>document.querySelector(target)?.scrollIntoView({behavior:'smooth',block:'start'}),80);
  }
};
if(typeof premiumNavAliases!=='undefined')premiumNavAliases.customerreview='customerreview';
openNotificationTarget=function(key){
  if(!canEdit()){toast('Only CEO/Admin can approve requests');return}
  $('#notificationMenu')?.classList.remove('open');
  if(key==='payments'){openModule('payments');return}
  if(key==='expiring'){openModule('reminders');return}
  if(key==='pauses'){state.focusApprovals='pauses';openModule('customers');return}
  openModule('customerreview');
};
openModule=function(module){
  const actual=module==='customerreview'?'customerreview':resolvePremiumModule(module);
  if(!canOpen(module)){locked(module);return}
  state.navModule=module;
  ({dashboard:renderDashboard,portal:renderPortal,customers:renderCustomers,customerreview:renderCustomerReview,subscriptions:renderSubscriptions,mealplans:renderMealPlans,kitchen:renderKitchen,packing:renderPacking,delivery:renderDelivery,drivers:renderDrivers,payments:renderPayments,reminders:renderReminders,reports:renderReports,settings:renderSettings}[actual]||renderDashboard)();
};

function customerDetailCard(number,title,body,editKey){const label=String(number).padStart(2,'0');const edit=canEdit()&&String(number)!=='9'&&editKey?'<button type="button" class="review-edit-btn customer-section-edit" data-customer-edit="'+escAttr(editKey)+'" data-customer-edit-title="'+escAttr(title)+'">Edit</button>':'';return '<article class="review-approval-card customer-detail-numbered-card"><div class="review-approval-card-head"><h3>'+label+'. '+escHtml(title)+'</h3>'+edit+'</div>'+body+'</article>'}
function customerOperationalId(c,index){return 'THK-'+new Date().getFullYear()+'-'+String(index+1).padStart(5,'0')}
function customerDetailTimelineRows(c){const rows=[];const add=(when,action,details,user)=>{if(!when)return;rows.push({time:activityDateObj(when)?.getTime()||0,cells:[activityTime(when),escHtml(action),escHtml(details),escHtml(user||'System')]})};const payment=ensurePaymentRecord(c);add(c.createdAt||c.registeredAt||c.joinDate,'Customer Added',(c.name||'Customer')+' added to the system','System');add(c.subscriptionStart,'Subscription Started',(c.name||'Customer')+' subscription started',c.approvedBy||'CEO/Admin');add(payment.uploadedDate||payment.proofUploadedAt,'Payment Uploaded',(c.name||'Customer')+' uploaded payment proof','Customer');add(payment.approvedDate||payment.paidAt,'Payment Approved','Payment approved for '+(c.name||'Customer'),payment.approvedBy||'CEO/Admin');customerPauseRequests(c).forEach(r=>add(r.createdAt||r.date||r.fromDate,'Pause / Resume Request',(r.type||r.status||'Request')+' for '+(c.name||'Customer'),r.by||'Customer'));(c.trialTimeline||[]).forEach(item=>add(item.date,item.text||'Trial timeline',c.name||'Customer','System'));(c.reviewHistory||c.history||[]).forEach(item=>add(item.time||item.date,item.action||'Customer Activity',item.details||c.name||'Customer',item.by||'System'));rows.sort((a,b)=>b.time-a.time);return rows.length?rows.map(r=>r.cells):[['-','No timeline yet','This customer has no recorded timeline events yet.','-']]}
function customerDetailEmpty(text){return '<div class="customer-detail-empty">'+escHtml(text)+'</div>'}
function customerDetailDate(value){return validDateValue(value)?displayDate(value):reviewSafe(value||'-')}
function customerPauseHistoryHtml(c){const rows=[];if(c.pauseStartDate)rows.push([customerDetailDate(c.pauseStartDate),'Pause Started',reviewSafe(c.pauseReason||'Direct pause'),reviewSafe(c.changedBy||'CEO/Admin')]);if(c.resumeDate)rows.push([customerDetailDate(c.resumeDate),'Resume Scheduled',reviewSafe(c.resumeReason||'Direct resume'),reviewSafe(c.changedBy||'CEO/Admin')]);customerPauseRequests(c).forEach(r=>rows.push([customerDetailDate(r.fromDate||r.createdAt||r.date||''),reviewSafe(r.type||r.status||'Pause / Resume'),reviewSafe(r.reason||r.note||'Customer request'),reviewSafe(r.by||'Customer')]));return rows.length?table(['Date','Action','Reason','By'],rows):customerDetailEmpty('No pause or resume history recorded yet.')}
function customerDifferentChoicesHtml(c){const rows=customerDifferentChoices(c).map(choice=>[reviewSafe(choice.dish),reviewStatusPill(choice.cat||c.cat||'-','good'),reviewSafe(differentChoiceMacro(choice,c))]);return rows.length?table(['Different Choice Dish','Category','Macro'],rows):customerDetailEmpty('No outside-menu different choice dishes recorded yet.')}
function customerSubscriptionAdjustmentHtml(c){const rows=customerAdjustments(c).map(a=>[customerDetailDate(a.effectiveDate||a.date||''),reviewSafe(a.type||'Subscription change'),reviewSafe(a.oldValue||a.oldPackage||'-'),reviewSafe(a.newValue||a.newPackage||a.mealPackage||'-'),reviewSafe(a.balance||a.creditNote||a.reason||'-')]);return rows.length?table(['Effective Date','Change Type','Old','New','Balance / Note'],rows):customerDetailEmpty('No subscription adjustment history recorded yet.')}
function customerWeekMenuSelectionsHtml(c){const weeks=(c.weeks&&c.weeks.length?c.weeks:defaultWeekSelections()).slice(0,4);const rows=[];weeks.forEach(w=>{['Breakfast','Lunch','Dinner','Snacks'].forEach(type=>{const selected=formatSelectedOptions(type,(w.menuOptions||w.menuItems||{})[type]);rows.push(['Week '+(w.week||rows.length+1),escHtml(type),reviewSafe(selected||'-'),reviewSafe(Object.entries(w.days||{}).filter(x=>x[1]).map(x=>x[0].slice(0,3)).join(', ')||'-')])})});return rows.length?table(['Week','Meal Type','Selected Options','Delivery Days'],rows):customerDetailEmpty('No 4 week menu selections saved yet.')}
function customerSectionNumber(value){const n=Number(value);return Number.isFinite(n)?n:0}
function customerSectionListText(list){return (Array.isArray(list)?list:[]).filter(Boolean).join(', ')}
function customerSectionSplitList(value){return String(value||'').split(',').map(x=>x.trim()).filter(Boolean)}
function customerSectionActions(){return '<div class="review-modal-actions"><button type="button" class="primary-btn light review-modal-cancel">Cancel</button><button type="submit" class="primary-btn green">Save Changes</button></div>'}
function customerSectionForm(fields,extra=''){return '<form class="review-modal-form customer-section-form">'+reviewModalFieldsHtml(fields)+extra+customerSectionActions()+'</form>'}
function customerSectionDeliveryFields(c){const area=c.area||qatarZones[c.zone]?.[0]||'';return '<form class="review-modal-form customer-section-form">'+
  '<label class="review-modal-field"><span>Delivery Place</span><select name="deliveryPreference"><option '+((c.deliveryPreference||'Home')==='Home'?'selected':'')+'>Home</option><option '+((c.deliveryPreference||'Home')==='Office'?'selected':'')+'>Office</option><option '+((c.deliveryPreference||'Home')==='Gym'?'selected':'')+'>Gym</option></select></label>'+
  '<label class="review-modal-field"><span>Qatar Zone</span><select id="detailZone" name="zone">'+zoneOptions(c.zone)+'</select></label>'+
  '<label class="review-modal-field"><span>Area Name</span><select id="detailArea" name="area">'+areaOptions(c.zone,area)+'</select></label>'+
  '<label class="review-modal-field"><span>Assigned Driver</span><select id="detailDriver" name="driverOverride">'+driverOptionsHtml(customerDriver(c))+'</select></label>'+
  reviewModalFieldsHtml([
    {name:'deliveryTime',label:'Preferred Delivery Time',value:c.deliveryTime||'08:00 AM'},
    {name:'deliveryWindow',label:'Delivery Window',value:c.deliveryWindow||'08:00 - 08:30'},
    {name:'address',label:'Address / Building',type:'textarea',rows:3,value:c.address||''},
    {name:'deliveryNote',label:'Delivery Notes',type:'textarea',rows:3,value:c.deliveryNote||''}
  ])+customerSectionActions()+'</form>'}
function customerDetailSectionEditorHtml(c,editKey){
  const h=c.health||{},n=h.nutrition||{},payment=ensurePaymentRecord(c),pkg=packageById(c.mealPackageId||'3m1s');
  const categoryOptions=mealCategories.map(x=>({value:x[0],label:'Category '+x[0]+' - '+x[1]+'g/'+x[2]+'g cooked portions'}));
  const packageOptions=mealSelectionPackages.map(p=>({value:p.id,label:p.label+' - '+money(p.price||0)}));
  if(editKey==='personal')return customerSectionForm([
    {name:'name',label:'Full Name',value:c.name||''},
    {name:'phone',label:'Phone / WhatsApp',value:c.phone||''},
    {name:'birthDate',label:'Date of Birth',type:'date',value:h.birthDate||c.birthDate||''},
    {name:'gender',label:'Gender',type:'select',value:h.gender||c.gender||'Male',options:['Male','Female']},
    {name:'language',label:'Preferred Language',type:'select',value:c.language||'English',options:['English','Arabic']}
  ]);
  if(editKey==='health')return customerSectionForm([
    {name:'goal',label:'Goal',value:c.goal||h.goal||''},
    {name:'activityLevel',label:'Activity Level',value:n.activityLevel||c.activityLevel||''},
    {name:'height',label:'Height (cm)',type:'number',value:h.height||''},
    {name:'weight',label:'Weight (kg)',type:'number',value:h.weight||''},
    {name:'calories',label:'Recommended Calories',type:'number',value:h.calories||n.systemRecommendedCalories||''},
    {name:'targetWeight',label:'Target Weight (kg)',type:'number',value:h.targetWeight||''}
  ]);
  if(editKey==='diet')return customerSectionForm([
    {name:'dietPreference',label:'Diet Preference',value:c.dietPreference||'Balanced'},
    {name:'notes',label:'Approved Kitchen Notes',type:'textarea',rows:4,value:c.notes||''},
    {name:'nutritionNote',label:'Nutritionist Instruction',type:'textarea',rows:4,value:h.nutritionNote||''}
  ]);
  if(editKey==='allergies')return customerSectionForm([
    {name:'allergies',label:'Allergies',type:'textarea',rows:3,value:customerSectionListText(c.allergies)},
    {name:'dislikes',label:'Ingredients They Do Not Like',type:'textarea',rows:3,value:customerSectionListText(c.dislikes)},
    {name:'medical',label:'Medical Conditions',type:'textarea',rows:3,value:customerSectionListText(c.medical)},
    {name:'allergyAlert',label:'Allergy Alert / Reaction Notes',type:'textarea',rows:3,value:h.allergyAlert||''}
  ]);
  if(editKey==='report')return customerSectionForm([
    {name:'bmi',label:'BMI',type:'number',value:h.reportMetrics?.bmi||h.bmi||''},
    {name:'bodyFat',label:'Body Fat %',type:'number',value:h.reportMetrics?.bodyFat||''},
    {name:'muscle',label:'Muscle Mass kg',type:'number',value:h.reportMetrics?.muscle||''},
    {name:'bmr',label:'BMR / Calories',type:'number',value:h.reportMetrics?.bmr||''},
    {name:'bodyAge',label:'Body Age',type:'number',value:h.reportMetrics?.bodyAge||''},
    {name:'reportNote',label:'Report Review Note',type:'textarea',rows:3,value:h.reportNote||''}
  ]);
  if(editKey==='category')return customerSectionForm([
    {name:'cat',label:'Kitchen Category',type:'select',value:c.cat||'A',options:categoryOptions},
    {name:'mealPackageId',label:'Meal Package',type:'select',value:c.mealPackageId||pkg.id||'3m1s',options:packageOptions},
    {name:'subscriptionDuration',label:'Duration',type:'select',value:c.subscriptionDuration||c.registrationPlanPayment?.duration||'monthly',options:[{value:'weekly',label:'1 Week'},{value:'twoWeeks',label:'2 Weeks'},{value:'monthly',label:'Monthly / 4 Weeks'}]},
    {name:'plan',label:'Subscription Package',value:c.plan||packagePlanName(c.mealPackageId)},
    {name:'status',label:'Customer Status',type:'select',value:c.status||'Active',options:['Active','Trial','Paused','Expired','Stopped','Custom']},
    {name:'subscriptionStart',label:'Subscription Start',type:'date',value:c.subscriptionStart||''},
    {name:'deliveryDays',label:'Delivery Packages',type:'number',value:c.deliveryDays||customerDeliveryDaysLabel(c).replace(/\D.*/,'')||packageDeliveryTotal(c)},
    {name:'receivedDeliveries',label:'Received Deliveries',type:'number',value:deliveredCount(c)}
  ],'<label class="review-modal-field span-full inline-check"><span>Friday Delivery</span><input name="includeFriday" type="checkbox" '+(customerHasFriday(c)?'checked':'')+'><b>Include Friday for this customer</b></label>');
  if(editKey==='delivery')return customerSectionDeliveryFields(c);
  if(editKey==='history')return customerSectionForm([
    {name:'action',label:'Timeline Action',value:'Customer detail update'},
    {name:'details',label:'Timeline Details',type:'textarea',rows:4,value:''},
    {name:'by',label:'Changed By',value:roles[state.role]?.label||'CEO/Admin'}
  ]);
  if(editKey==='pause-history')return customerSectionForm([
    {name:'pauseStartDate',label:'Pause From Date',type:'date',value:c.pauseStartDate||''},
    {name:'resumeDate',label:'Resume Date',type:'date',value:c.resumeDate||''},
    {name:'pauseReason',label:'Pause / Resume Reason',type:'textarea',rows:3,value:c.pauseReason||''},
    {name:'status',label:'Customer Status',type:'select',value:c.status||'Active',options:['Active','Paused','Stopped']}
  ]);
  if(editKey==='different-choices')return customerSectionForm([
    {name:'differentChoices',label:'Different Choice Dishes',type:'textarea',rows:7,value:differentChoiceText(c)}
  ],'<div class="customer-detail-empty span-full">One line per dish. Example: Plain grilled chicken with rice | C</div>');
  if(editKey==='subscription-adjustments')return customerSectionForm([
    {name:'effectiveDate',label:'Effective From',type:'date',value:new Date().toISOString().slice(0,10)},
    {name:'type',label:'Change Type',type:'select',value:'Subscription Change',options:['Friday Delivery Change','Meal Package Change','Friday + Meal Package Change','Payment / Balance Note','Subscription Change']},
    {name:'newValue',label:'New Value / Change',value:''},
    {name:'balance',label:'Balance / Credit Note',value:''},
    {name:'reason',label:'Reason',type:'textarea',rows:3,value:''}
  ],'<div class="span-full customer-section-history-preview">'+customerSubscriptionAdjustmentHtml(c)+'</div>');
  if(editKey==='week-selections')return '<form class="customer-section-form customer-week-section-form">'+weekPlannerHtml(c,true)+customerSectionActions()+'</form>';
  return customerSectionForm([{name:'details',label:'Details',type:'textarea',rows:5,value:''}]);
}
function saveCustomerDetailSection(c,editKey,form){
  const data=Object.fromEntries(new FormData(form).entries());
  c.health=c.health||{};c.health.nutrition=c.health.nutrition||{};
  if(editKey==='personal'){c.name=data.name||c.name;c.phone=data.phone||c.phone;c.language=data.language||c.language;c.health.birthDate=data.birthDate||'';c.birthDate=data.birthDate||'';c.health.gender=data.gender||'';c.gender=data.gender||''}
  if(editKey==='health'){const height=customerSectionNumber(data.height),weight=customerSectionNumber(data.weight);c.goal=data.goal||'';c.activityLevel=data.activityLevel||'';c.health.goal=data.goal||'';c.health.height=height||'';c.health.weight=weight||'';c.health.targetWeight=customerSectionNumber(data.targetWeight)||'';c.health.calories=customerSectionNumber(data.calories)||'';c.health.nutrition.activityLevel=data.activityLevel||'';c.health.nutrition.systemRecommendedCalories=customerSectionNumber(data.calories)||'';if(height&&weight)c.health.bmi=Number((weight/((height/100)*(height/100))).toFixed(1))}
  if(editKey==='diet'){c.dietPreference=data.dietPreference||'';c.notes=data.notes||'';c.health.nutritionNote=data.nutritionNote||''}
  if(editKey==='allergies'){c.allergies=customerSectionSplitList(data.allergies);c.dislikes=customerSectionSplitList(data.dislikes);c.medical=customerSectionSplitList(data.medical);c.health.allergyAlert=data.allergyAlert||''}
  if(editKey==='report'){c.health.reportMetrics={bmi:customerSectionNumber(data.bmi)||'',bodyFat:customerSectionNumber(data.bodyFat)||'',muscle:customerSectionNumber(data.muscle)||'',bmr:customerSectionNumber(data.bmr)||'',bodyAge:customerSectionNumber(data.bodyAge)||''};c.health.bmi=c.health.reportMetrics.bmi||c.health.bmi||'';c.health.reportNote=data.reportNote||''}
  if(editKey==='category'){c.cat=data.cat||c.cat;c.mealPackageId=data.mealPackageId||c.mealPackageId;c.subscriptionDuration=data.subscriptionDuration||c.subscriptionDuration;c.plan=data.plan||packagePlanName(c.mealPackageId);c.status=data.status||c.status;c.subscriptionStart=data.subscriptionStart||c.subscriptionStart;c.deliveryDays=Number(data.deliveryDays||c.deliveryDays||packageDeliveryTotal(c));c.receivedDeliveries=customerSectionNumber(data.receivedDeliveries);c.includeFriday=!!data.includeFriday;c.subscriptionEnd=packageProgress(c).completionDate||c.subscriptionEnd}
  if(editKey==='delivery'){c.deliveryPreference=data.deliveryPreference||'';c.zone=data.zone||c.zone;c.area=data.area||c.area;c.driverOverride=(data.driverOverride&&data.driverOverride!==assignedDriver(c.zone))?data.driverOverride:'';c.deliveryTime=data.deliveryTime||'';c.deliveryWindow=data.deliveryWindow||'';c.address=data.address||'';c.deliveryNote=data.deliveryNote||''}
  if(editKey==='history'&&(data.action||data.details)){c.history=c.history||[];c.history.unshift({time:new Date().toLocaleString(),action:data.action||'Customer detail update',details:data.details||'',by:data.by||roles[state.role]?.label||'CEO/Admin'})}
  if(editKey==='pause-history'){c.pauseStartDate=data.pauseStartDate||'';c.resumeDate=data.resumeDate||'';c.pauseReason=data.pauseReason||'';c.status=data.status||c.status}
  if(editKey==='different-choices'){c.differentChoices=parseDifferentChoiceText(data.differentChoices||'',c)}
  if(editKey==='subscription-adjustments'&&(data.newValue||data.reason||data.balance)){c.adjustments=customerAdjustments(c);c.adjustments.unshift({effectiveDate:data.effectiveDate||new Date().toISOString().slice(0,10),type:data.type||'Subscription Change',oldValue:'Current: '+packageById(c.mealPackageId||'3m1s').label,newValue:data.newValue||'Manual update',balance:data.balance||'',reason:data.reason||'',by:roles[state.role]?.label||'CEO/Admin'});saveCustomerAdjustments(c)}
  if(editKey==='week-selections'){c.weeks=collectWeekSelections();c.lastMenuSelectionDate=new Date().toISOString().slice(0,10)}
  saveCustomerState(c);
}
function openCustomerDetailEditModal(index,title,editKey){const c=customers[Number(index)];if(!c)return;let modal=document.querySelector('#reviewEditModal');if(!modal){modal=document.createElement('div');modal.id='reviewEditModal';modal.className='review-modal-layer';document.body.appendChild(modal)}const wide=editKey==='week-selections'||editKey==='subscription-adjustments';modal.innerHTML='<div class="review-modal-card customer-detail-edit-modal '+(wide?'section-wide':'section-compact')+'"><div class="review-modal-head"><div><b>Edit '+escHtml(title)+'</b><span>Only this customer section will be updated</span></div><button type="button" class="review-modal-close">Close</button></div>'+customerDetailSectionEditorHtml(c,editKey)+'</div>';modal.classList.add('open');const close=()=>modal.classList.remove('open');modal.querySelector('.review-modal-close')?.addEventListener('click',close);modal.querySelector('.review-modal-cancel')?.addEventListener('click',close);bindZoneArea(modal);if(editKey==='week-selections'){bindWeekPackageActions();modal.querySelector('#detailMealPackage')?.addEventListener('change',refreshWeekPlannerForPackage);modal.querySelector('#detailIncludeFriday')?.addEventListener('change',refreshWeekPlannerForPackage)}modal.querySelector('form.customer-section-form')?.addEventListener('submit',e=>{e.preventDefault();saveCustomerDetailSection(c,editKey,e.currentTarget);close();openCustomerDetails(index);toast(title+' updated')})}
function addedDaysPreviewHtml(c,days){
  const total=packageDeliveryTotal(c);
  const received=deliveredCount(c);
  const oldEnd=c.subscriptionEnd||packageProgress(c).completionDate||'';
  const nextTotal=total+Math.max(0,Number(days||0));
  const draft={...c,deliveryDays:nextTotal};
  const next=packageProgress(draft);
  return '<div class="add-days-preview"><article><span>Current Balance</span><strong>'+Math.max(0,total-received)+' / '+total+'</strong><small>remaining / total packages</small></article><article><span>After Add Days</span><strong>'+next.remaining+' / '+next.total+'</strong><small>remaining / total packages</small></article><article><span>Current End</span><strong>'+(oldEnd?displayDate(oldEnd):'Pending')+'</strong><small>based on delivery days</small></article><article><span>New End</span><strong>'+(next.completionDate?displayDate(next.completionDate):'Pending')+'</strong><small>Friday/excluded days respected</small></article></div>'
}
function openAddCustomerDaysModal(index){
  if(!canEdit()){toast('Only CEO/Admin can add package days');return}
  const c=customers[Number(index)];
  if(!c)return;
  let modal=document.querySelector('#reviewEditModal');
  if(!modal){modal=document.createElement('div');modal.id='reviewEditModal';modal.className='review-modal-layer';document.body.appendChild(modal)}
  const today=new Date().toISOString().slice(0,10);
  modal.innerHTML='<div class="review-modal-card customer-detail-edit-modal section-compact add-days-modal"><div class="review-modal-head"><div><b>Add Package Days</b><span>CEO/Admin manual package adjustment for '+escHtml(c.name||'customer')+'</span></div><button type="button" class="review-modal-close">Close</button></div><form class="review-modal-form customer-section-form" id="addCustomerDaysForm">'+
    '<label class="review-modal-field"><span>Days To Add</span><input id="manualAddDays" name="days" type="number" min="1" max="120" value="1" required></label>'+
    '<label class="review-modal-field"><span>Effective Date</span><input name="effectiveDate" type="date" value="'+today+'"></label>'+
    '<label class="review-modal-field span-full"><span>Reason</span><select name="reason"><option>Compensation / Service Issue</option><option>Missed Delivery Credit</option><option>Paid Extra Days</option><option>Management Courtesy</option><option>Manual Correction</option></select></label>'+
    '<label class="review-modal-field span-full"><span>Admin Note</span><textarea name="note" rows="3" placeholder="Example: Added 2 days because delivery was missed."></textarea></label>'+
    '<div class="span-full" id="addDaysPreview">'+addedDaysPreviewHtml(c,1)+'</div>'+
    '<div class="review-modal-actions"><button type="button" class="primary-btn light review-modal-cancel">Cancel</button><button type="submit" class="primary-btn green">Add Days</button></div>'+
  '</form></div>';
  modal.classList.add('open');
  const close=()=>modal.classList.remove('open');
  modal.querySelector('.review-modal-close')?.addEventListener('click',close);
  modal.querySelector('.review-modal-cancel')?.addEventListener('click',close);
  modal.querySelector('#manualAddDays')?.addEventListener('input',e=>{const preview=modal.querySelector('#addDaysPreview');if(preview)preview.innerHTML=addedDaysPreviewHtml(c,e.target.value)});
  modal.querySelector('#addCustomerDaysForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.currentTarget).entries());
    const days=Math.max(1,Math.min(120,Number(data.days||1)));
    const before=packageProgress(c);
    const oldEnd=c.subscriptionEnd||before.completionDate||'';
    c.deliveryDays=packageDeliveryTotal(c)+days;
    const after=packageProgress(c);
    c.subscriptionEnd=after.completionDate||c.subscriptionEnd;
    c.adjustments=customerAdjustments(c);
    c.adjustments.unshift({effectiveDate:data.effectiveDate||today,type:'Manual Added Days',oldValue:before.total+' packages / '+before.remaining+' remaining',newValue:after.total+' packages / '+after.remaining+' remaining',balance:'+'+days+' package day(s)',reason:(data.reason||'Manual adjustment')+(data.note?': '+data.note:''),by:roles[state.role]?.label||'CEO/Admin'});
    c.history=c.history||[];
    c.history.unshift({time:new Date().toLocaleString(),action:'Package Days Added',details:days+' package day(s) added. End date '+(oldEnd?displayDate(oldEnd):'Pending')+' -> '+(c.subscriptionEnd?displayDate(c.subscriptionEnd):'Pending')+'.',by:roles[state.role]?.label||'CEO/Admin'});
    if(c.backendId&&window.THK_API?.enabled){
      try{
        const result=await window.THK_API.addDays(c.backendId,days,(data.reason||'Manual adjustment')+(data.note?': '+data.note:''));
        if(result?.customer)Object.assign(c,result.customer);
      }catch(error){
        if(!backendFallbackAllowed(error)){toast(backendApiErrorMessage(error,'Package days could not be added.'));return}
      }
    }
    saveCustomerAdjustments(c);
    saveCustomerState(c);
    close();
    openCustomerDetails(index);
    toast(days+' package day(s) added for '+(c.name||'customer'));
  });
}
function customerDetailsHtml(c,index){
  const h=c.health||{},n=h.nutrition||{},payment=ensurePaymentRecord(c),pkg=packageById(c.mealPackageId||'3m1s');
  const allergyItems=(c.allergies||[]).length?c.allergies:['None'];
  const dislikeItems=(c.dislikes||[]).length?c.dislikes:['None'];
  const medicalItems=(c.medical||[]).filter(x=>x&&x!=='None');
  const personal=customerDetailCard('1','Personal Information',reviewRows([['Customer ID',reviewSafe(customerOperationalId(c,index))],['Full Name',reviewSafe(c.name)],['Phone',reviewSafe(c.phone)],['Phone Verification',phoneVerificationPill(c)],['Date of Birth',reviewSafe(displayBirthDate(h.birthDate||c.birthDate||''))],['Gender',reviewSafe(h.gender||c.gender||'-')],['Preferred Language',reviewSafe(c.language||'English')]]),'personal');
  const health=customerDetailCard('2','Goal & Body Information',reviewRows([['Goal',reviewSafe(c.goal||h.goal||'-')],['Activity Level',reviewSafe(n.activityLevel||c.activityLevel||'-')],['Height',h.height?reviewSafe(h.height+' cm'):'-'],['Weight',h.weight?reviewSafe(h.weight+' kg'):'-'],['BMI',reviewSafe(h.bmi||'-')],['Recommended Calories',h.calories?reviewSafe(h.calories+' kcal'):reviewSafe(n.systemRecommendedCalories?n.systemRecommendedCalories+' kcal':'-')]]),'health');
  const diet=customerDetailCard('3','Diet & Food Notes','<div class="approval-notes-grid">'+reviewNoteCard('Diet Preference',c.dietPreference||'Balanced')+reviewNoteCard('Kitchen Notes',c.notes||'No kitchen notes')+reviewNoteCard('Delivery Notes',c.deliveryNote||'No delivery note')+'</div>','diet');
  const allergy=customerDetailCard('4','Allergies & Dislikes','<div class="allergy-head"><span>Allergies</span>'+(allergyItems[0]!=='None'?'<b>Allergy Alert</b>':'')+'</div>'+reviewTags(allergyItems,allergyItems[0]==='None'?'neutral':'danger')+'<div class="allergy-head"><span>Ingredients They Do Not Like</span></div>'+reviewTags(dislikeItems,'neutral')+'<div class="allergy-head"><span>Medical Conditions</span></div>'+reviewTags(medicalItems.length?medicalItems:['None'],'neutral'),'allergies');
  const report=customerDetailCard('5','BMI / Body Report',bmiReportPreviewHtml(h.bmiReport,'customer',index)+'<div class="report-mini-grid approval-report-grid"><span>BMI: '+(h.reportMetrics?.bmi||h.bmi||'-')+'</span><span>Body Fat: '+(h.reportMetrics?.bodyFat?h.reportMetrics.bodyFat+'%':'-')+'</span><span>Muscle: '+(h.reportMetrics?.muscle?h.reportMetrics.muscle+' kg':'-')+'</span><span>BMR: '+(h.reportMetrics?.bmr?h.reportMetrics.bmr+' kcal':'-')+'</span></div>','report');
  const category=customerDetailCard('6','Package & Category',reviewRows([['Duration',reviewSafe(customerSubscriptionDurationLabel(c))],['Delivery Days',reviewSafe(customerDeliveryDaysLabel(c))],['Meal Package',reviewSafe(pkg.label||'-')],['Subscription Package',reviewSafe(c.plan||packagePlanName(c.mealPackageId))],['Category',reviewStatusPill(c.cat||'-','good')+' <span class="muted">'+reviewSafe(reviewMacroText(c.cat||'A'))+'</span>'],['Status',reviewStatusPill(customerStatusValue(c),'good')],['Payment Status',reviewStatusPill(paymentStatusText(c),/paid/i.test(paymentStatusText(c))?'good':'warn')],['Subscription End',customerEndText(c)]]),'category');
  const delivery=customerDetailCard('7','Delivery Information',reviewRows([['Delivery Place',reviewSafe(c.deliveryPreference||'-')],['Zone / Area',reviewSafe(zoneShort(c.zone))+' / '+reviewSafe(c.area||'-')],['Preferred Time',reviewSafe(c.deliveryTime||'-')],['Delivery Window',reviewSafe(c.deliveryWindow||'-')],['Assigned Driver',reviewSafe(customerDriver(c)||'-')],['Google Location','<a class="map-link" target="_blank" href="'+customerMapLink(c)+'">View on Map</a>'],['Address',reviewSafe(c.address||'-')]]),'delivery');
  const history=customerDetailCard('8','History & Activity',table(['Date & Time','Action','Details','Changed By'],customerDetailTimelineRows(c)),'history');
  const pauseHistory=customerDetailCard('10','Historical Paused and Resumes',customerPauseHistoryHtml(c),'pause-history');
  const differentChoices=customerDetailCard('11','Different Choice Dishes',customerDifferentChoicesHtml(c),'different-choices');
  const subscriptionAdjustments=customerDetailCard('12','Subscription Adjustment History',customerSubscriptionAdjustmentHtml(c),'subscription-adjustments');
  const weekSelections=customerDetailCard('13','4 Week Menu Selections',customerWeekMenuSelectionsHtml(c),'week-selections');
  const actions='<div class="approval-action-buttons">'+(canEdit()?'<button class="primary-btn green open-add-days-modal" type="button" data-customer-index="'+index+'">Add Days</button>':'')+'<button class="primary-btn light customer-detail-jump" type="button" data-customer-jump="payments">Open Payments</button><button class="primary-btn light customer-detail-jump" type="button" data-customer-jump="delivery">Open Delivery</button><button class="primary-btn light customer-detail-jump" type="button" data-customer-jump="reports">Open Reports</button></div>';
  return '<section class="approval-workspace customer-detail-workspace"><div class="approval-topbar"><div><h2>Customer Details</h2><span class="approval-pill good">'+escHtml(customerStatusValue(c))+'</span></div><div class="approval-main-actions"><button class="primary-btn light" id="backCustomerList">Back to Customers</button></div></div><div class="approval-profile-strip"><div class="approval-avatar"><span>'+escHtml(customerInitials(c.name))+'</span></div><div><h1>'+reviewSafe(c.name)+'</h1><span class="approval-pill good">Customer Profile</span>'+reviewInfoRow('Customer ID',customerOperationalId(c,index))+reviewInfoRow('Phone',reviewSafe(c.phone))+'</div><div>'+reviewInfoRow('Category',reviewStatusPill(c.cat||'-','good'))+reviewInfoRow('Package',reviewSafe(pkg.label||'-'))+'</div><div>'+reviewInfoRow('Zone / Area',reviewSafe(zoneShort(c.zone))+' / '+reviewSafe(c.area||'-'))+reviewInfoRow('Driver',reviewSafe(customerDriver(c)||'-'))+'</div><div>'+reviewInfoRow('Payment',reviewStatusPill(paymentStatusText(c),/paid/i.test(paymentStatusText(c))?'good':'warn'))+reviewInfoRow('Since',reviewSafe(c.subscriptionStart?displayDate(c.subscriptionStart):'-'))+'</div></div><div class="approval-layout"><div class="approval-left">'+personal+health+diet+allergy+report+'</div><div class="approval-center">'+category+history+pauseHistory+subscriptionAdjustments+'</div><div class="approval-right">'+delivery+customerDetailCard('9','Quick Actions',actions)+differentChoices+weekSelections+'</div></div></section>'
}
function bindCustomerDetailDelegates(){if(window.__customerDetailDelegatesBound)return;window.__customerDetailDelegatesBound=true;document.addEventListener('click',e=>{const editBtn=e.target.closest?.('.customer-detail-workspace .customer-section-edit');if(editBtn){e.preventDefault();e.stopPropagation();const index=Number(selectedCustomerIndex);if(Number.isFinite(index)&&customers[index])openCustomerDetailEditModal(index,editBtn.dataset.customerEditTitle||'Customer Details',editBtn.dataset.customerEdit||'details');return}const addDaysBtn=e.target.closest?.('.customer-detail-workspace .open-add-days-modal');if(addDaysBtn){e.preventDefault();e.stopPropagation();openAddCustomerDaysModal(Number(addDaysBtn.dataset.customerIndex||selectedCustomerIndex));return}const jumpBtn=e.target.closest?.('.customer-detail-workspace .customer-detail-jump');if(jumpBtn){e.preventDefault();openModule(jumpBtn.dataset.customerJump)}})}
function openCustomerDetails(index){const c=customers[Number(index)];if(!c){toast('Customer not found');renderCustomers();return}selectedCustomerIndex=Number(index);state.module='customers';state.navModule='customers';moduleFrame('Customers','',customerDetailsHtml(c,Number(index)));bindCustomerDetailDelegates();$('#backCustomerList')?.addEventListener('click',renderCustomers);toast((c.name||'Customer')+' details opened')}

function reviewSafe(value,fallback='-'){return escHtml(value===undefined||value===null||value===''?fallback:value)}
function reviewRows(rows){return '<div class="review-detail-list">'+rows.map(row=>'<div class="review-detail-row"><span>'+escHtml(row[0])+'</span><strong>'+row[1]+'</strong></div>').join('')+'</div>'}
function reviewCard(number,title,body,type){return '<article class="review-approval-card"><div class="review-approval-card-head"><h3>'+number+'. '+escHtml(title)+'</h3><button type="button" class="review-edit-btn" data-review-edit="'+escAttr(type)+'">Edit</button></div>'+body+'</article>'}
function reviewTags(items,kind='neutral'){const list=(items||[]).filter(Boolean);return '<div class="review-tag-row">'+(list.length?list:['None']).map(item=>'<span class="review-tag '+kind+'">'+reviewSafe(item)+'</span>').join('')+'</div>'}
function reviewPersonId(p,index){return 'THK-'+new Date().getFullYear()+'-'+String(index+1).padStart(5,'0')}
function reviewStatusPill(label,kind='warn'){return '<span class="review-status-pill '+kind+'">'+reviewSafe(label)+'</span>'}
function phoneVerificationPill(person){return person?.phoneVerified?reviewStatusPill('Phone Verified','good'):reviewStatusPill('Not Verified','warn')}
function reviewMacroText(cat){const row=mealCategories.find(x=>x[0]===cat)||mealCategories[0];return row[1]+'P / '+row[2]+'C'}
function reviewHistoryRows(p){const h=p.health||{},n=h.nutrition||{},now=n.calculatedAt?new Date(n.calculatedAt).toLocaleString():new Date().toLocaleString();const rows=(p.reviewHistory||[]).map(x=>[reviewSafe(x.time),reviewSafe(x.action),reviewSafe(x.details),reviewSafe(x.by)]);return rows.length?rows:[[now,'Customer Registration','Customer registered and submitted details','Customer'],[now,'Automatic Calculation','Nutrition recommendation calculated by system','System'],[now,'Document Upload',h.bmiReport?'Body report uploaded':'No body report uploaded','Customer']]}
function savePendingReviewPatch(index,patch,historyText){
  const list=pendingCustomers();
  const p=list[Number(index)];
  if(!p)return null;
  Object.assign(p,patch.root||{});
  if(patch.health){p.health=Object.assign({},p.health||{},patch.health)}
  if(patch.nutrition){p.health=p.health||{};p.health.nutrition=Object.assign({},p.health.nutrition||{},patch.nutrition)}
  if(patch.payment){p.payment=Object.assign({},p.payment||{},patch.payment)}
  if(historyText){p.reviewHistory=p.reviewHistory||[];p.reviewHistory.unshift({time:new Date().toLocaleString(),action:'Review Edit',details:historyText,by:roles[state.role]?.label||'CEO/Admin'})}
  savePendingCustomers(list);
  return p;
}
function reviewModalFieldsHtml(fields){return fields.map(field=>{
  const value=field.value===undefined||field.value===null?'':field.value;
  if(field.type==='textarea')return '<label class="review-modal-field span-full"><span>'+escHtml(field.label)+'</span><textarea name="'+escAttr(field.name)+'" rows="'+(field.rows||4)+'">'+escHtml(value)+'</textarea></label>';
  if(field.type==='select')return '<label class="review-modal-field"><span>'+escHtml(field.label)+'</span><select name="'+escAttr(field.name)+'">'+(field.options||[]).map(opt=>'<option value="'+escAttr(opt.value||opt)+'" '+((opt.value||opt)===value?'selected':'')+'>'+escHtml(opt.label||opt)+'</option>').join('')+'</select></label>';
  return '<label class="review-modal-field"><span>'+escHtml(field.label)+'</span><input name="'+escAttr(field.name)+'" type="'+escAttr(field.type||'text')+'" value="'+escAttr(value)+'"></label>';
}).join('')}
function openReviewModal(title,fields,onSave){
  let modal=document.querySelector('#reviewEditModal');
  if(!modal){modal=document.createElement('div');modal.id='reviewEditModal';modal.className='review-modal-layer';document.body.appendChild(modal)}
  modal.innerHTML='<div class="review-modal-card"><div class="review-modal-head"><div><b>'+escHtml(title)+'</b><span>CEO/Admin review update</span></div><button type="button" class="review-modal-close">Close</button></div><form class="review-modal-form">'+reviewModalFieldsHtml(fields)+'<div class="review-modal-actions"><button type="button" class="primary-btn light review-modal-cancel">Cancel</button><button type="submit" class="primary-btn green">Save Changes</button></div></form></div>';
  modal.classList.add('open');
  const close=()=>modal.classList.remove('open');
  modal.querySelector('.review-modal-close')?.addEventListener('click',close);
  modal.querySelector('.review-modal-cancel')?.addEventListener('click',close);
  modal.querySelector('form')?.addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget).entries());onSave(data);close()});
}
function splitReviewList(value){return String(value||'').split(',').map(x=>x.trim()).filter(Boolean)}
function openReviewEditModal(index,type){
  const list=pendingCustomers();const p=list[Number(index)];if(!p)return;
  const h=p.health||{},n=h.nutrition||{},payment=p.payment||{},pkg=packageById(p.mealPackageId||'3m1s');
  const categoryOptions=mealCategories.map(x=>({value:x[0],label:'Category '+x[0]+' - '+x[1]+'g/'+x[2]+'g cooked portions'}));
  const driverOptions=drivers.map(d=>({value:d[0],label:d[0]}));
  const saveAndRefresh=(patch,msg)=>{savePendingReviewPatch(index,patch,msg);openCustomerReviewDetail(index);toast(msg)};
  if(type==='personal')return openReviewModal('Personal Information',[
    {name:'name',label:'Full Name',value:p.name},{name:'birthDate',label:'Date of Birth',type:'date',value:h.birthDate||''},{name:'gender',label:'Gender',type:'select',value:h.gender||'',options:['Male','Female','Not set']},{name:'language',label:'Preferred Language',value:p.language||'English'}
  ],data=>saveAndRefresh({root:{name:data.name,language:data.language},health:{birthDate:data.birthDate,gender:data.gender}},'Personal information updated'));
  if(type==='body')return openReviewModal('Goal & Body Information',[
    {name:'goal',label:'Goal',value:p.goal||''},{name:'activityLevel',label:'Activity Level',value:n.activityLevel||''},{name:'height',label:'Height (cm)',type:'number',value:h.height||''},{name:'weight',label:'Current Weight (kg)',type:'number',value:h.weight||''},{name:'targetWeight',label:'Target Weight (kg)',type:'number',value:h.targetWeight||''}
  ],data=>{const height=Number(data.height||0),weight=Number(data.weight||0);const bmi=height&&weight?Number((weight/((height/100)*(height/100))).toFixed(1)):h.bmi;saveAndRefresh({root:{goal:data.goal},health:{height,weight,targetWeight:data.targetWeight,bmi,status:bmi?(bmi<18.5?'Underweight':bmi<25?'Healthy':bmi<30?'Overweight':'Obese'):h.status},nutrition:{goal:data.goal,activityLevel:data.activityLevel}},'Goal and body information updated')});
  if(type==='diet')return openReviewModal('Diet Preference',[
    {name:'dietPreference',label:'Diet Preference',value:p.dietPreference||''},{name:'dietaryRestrictions',label:'Dietary Restrictions',value:p.dietaryRestrictions||''}
  ],data=>saveAndRefresh({root:data},'Diet preference updated'));
  if(type==='allergies')return openReviewModal('Allergies & Dislikes',[
    {name:'allergies',label:'Allergies (comma separated)',type:'textarea',value:(p.allergies||[]).join(', ')},{name:'dislikes',label:'Dislikes (comma separated)',type:'textarea',value:(p.dislikes||[]).join(', ')}
  ],data=>saveAndRefresh({root:{allergies:splitReviewList(data.allergies),dislikes:splitReviewList(data.dislikes)}},'Allergies and dislikes updated'));
  if(type==='medical')return openReviewModal('Medical & Body Report',[
    {name:'medical',label:'Medical Conditions (comma separated)',type:'textarea',value:(p.medical||[]).join(', ')},{name:'bodyFat',label:'Body Fat %',type:'number',value:h.reportMetrics?.bodyFat||''},{name:'muscle',label:'Muscle Mass kg',type:'number',value:h.reportMetrics?.muscle||''},{name:'bmr',label:'BMR / Calories',type:'number',value:h.reportMetrics?.bmr||''}
  ],data=>{const reportMetrics=Object.assign({},h.reportMetrics||{},{bodyFat:data.bodyFat,muscle:data.muscle,bmr:data.bmr});saveAndRefresh({root:{medical:splitReviewList(data.medical)},health:{reportMetrics}},'Medical and body report values updated')});
  if(type==='nutrition'||type==='calories'||type==='protein'||type==='carbs'||type==='fat')return openReviewModal('Automatic Nutrition Recommendation',[
    {name:'approvedCalories',label:'Approved Calories',type:'number',value:n.approvedCalories||h.calories||n.systemRecommendedCalories||''},{name:'approvedProtein',label:'Approved Protein (g)',type:'number',value:n.approvedProtein||n.systemRecommendedProtein||''},{name:'approvedCarbs',label:'Approved Carbohydrates (g)',type:'number',value:n.approvedCarbs||n.systemRecommendedCarbs||''},{name:'approvedFat',label:'Approved Fat (g)',type:'number',value:n.approvedFat||n.systemRecommendedFat||''},{name:'nutritionNotes',label:'Nutrition Notes',type:'textarea',value:n.nutritionNotes||''}
  ],data=>saveAndRefresh({health:{calories:Number(data.approvedCalories||0)},nutrition:{approvedCalories:Number(data.approvedCalories||0),approvedProtein:Number(data.approvedProtein||0),approvedCarbs:Number(data.approvedCarbs||0),approvedFat:Number(data.approvedFat||0),nutritionNotes:data.nutritionNotes,nutritionStatus:'Approved',approvedBy:roles[state.role]?.label||'CEO/Admin',approvedAt:new Date().toISOString()}},'Nutrition recommendation approved'));
  if(type==='category')return openReviewModal('Kitchen Category',[
    {name:'cat',label:'Approved Category',type:'select',value:p.cat||n.assignedCategory||'A',options:categoryOptions},{name:'nutritionNotes',label:'Category Notes',type:'textarea',value:n.nutritionNotes||''}
  ],data=>saveAndRefresh({root:{cat:data.cat},nutrition:{assignedCategory:data.cat,nutritionNotes:data.nutritionNotes}},'Kitchen category updated'));
  if(type==='package')return openReviewModal('Package & Subscription',[
    {name:'mealPackageId',label:'Meal Package',type:'select',value:p.mealPackageId||'3m1s',options:mealSelectionPackages.map(x=>({value:x.id,label:x.label}))},{name:'plan',label:'Subscription Package',value:p.plan||packagePlanName(p.mealPackageId)},{name:'customMeals',label:'Custom Meals',type:'number',value:p.customMeals||''},{name:'customSnacks',label:'Custom Snacks',type:'number',value:p.customSnacks||''},{name:'subscriptionStart',label:'Requested Start Date',type:'date',value:p.subscriptionStart||''},{name:'includeFriday',label:'Friday Delivery',type:'select',value:p.includeFriday?'Yes':'No',options:['No','Yes']}
  ],data=>saveAndRefresh({root:{mealPackageId:data.mealPackageId,plan:data.plan,customMeals:Number(data.customMeals||0),customSnacks:Number(data.customSnacks||0),subscriptionStart:data.subscriptionStart,includeFriday:data.includeFriday==='Yes'}},'Package and subscription updated'));
  if(type==='payment')return openReviewModal('Payment Information',[
    {name:'status',label:'Payment Status',type:'select',value:payment.status||p.paymentStatus||'Awaiting Payment',options:['Awaiting Payment','Cash Pending','Payment Proof Uploaded','Waiting Admin Approval','Paid','Rejected']},{name:'method',label:'Payment Method',value:payment.method||''},{name:'amount',label:'Amount',type:'number',value:payment.amount||pkg.price||''},{name:'transactionId',label:'Transaction ID',value:payment.transactionId||''}
  ],data=>saveAndRefresh({payment:data,root:{paymentStatus:data.status}},'Payment information updated'));
  if(type==='delivery')return openReviewModal('Delivery Information',[
    {name:'deliveryPreference',label:'Delivery Place',value:p.deliveryPreference||''},{name:'zone',label:'Zone',type:'select',value:p.zone||'',options:Object.keys(qatarZones).map(z=>({value:z,label:z}))},{name:'area',label:'Area',value:p.area||''},{name:'address',label:'Address',type:'textarea',value:p.address||''},{name:'deliveryTime',label:'Preferred Time',value:p.deliveryTime||''},{name:'driverOverride',label:'Assigned Driver',type:'select',value:p.driverOverride||assignedDriver(p.zone),options:driverOptions},{name:'deliveryNote',label:'Delivery Notes',type:'textarea',value:p.deliveryNote||''}
  ],data=>saveAndRefresh({root:data},'Delivery information updated'));
  if(type==='notes')return openReviewModal('Notes',[
    {name:'customerNote',label:'Customer Note',type:'textarea',value:p.customerNote||'Registration submitted from customer portal.'},{name:'notes',label:'Approved Kitchen Instruction',type:'textarea',value:p.notes||''},{name:'nutritionNotes',label:'Nutritionist Instruction',type:'textarea',value:n.nutritionNotes||''},{name:'deliveryNote',label:'Delivery Instruction',type:'textarea',value:p.deliveryNote||''},{name:'internalNote',label:'Private Internal Note',type:'textarea',value:p.internalNote||''}
  ],data=>saveAndRefresh({root:{customerNote:data.customerNote,notes:data.notes,deliveryNote:data.deliveryNote,internalNote:data.internalNote},nutrition:{nutritionNotes:data.nutritionNotes}},'Notes updated'));
}
function pendingReviewActionsHtml(index){return '<div class="review-action-center-grid"><button type="button" class="primary-btn light" data-review-edit="nutrition">Edit Calories</button><button type="button" class="primary-btn light" data-review-edit="nutrition">Edit Protein</button><button type="button" class="primary-btn light" data-review-edit="nutrition">Edit Carbohydrates</button><button type="button" class="primary-btn light" data-review-edit="nutrition">Edit Fat</button><button type="button" class="primary-btn light" data-review-edit="category">Change Category</button><button type="button" class="primary-btn light" data-review-edit="delivery">Assign Driver</button><button type="button" class="primary-btn light action-start-trial">Start Trial</button><button type="button" class="primary-btn light action-pause-subscription">Pause Subscription</button><button type="button" class="primary-btn light action-more-info">Request More Info</button><button type="button" class="primary-btn danger remove-pending" data-pending-index="'+index+'">Reject Plan</button></div>'}
pendingReviewHtml=function(p,index){
  const h=p.health||{},rm=h.reportMetrics||{},n=h.nutrition||{},payment=p.payment||{};
  const rec=p.cat||n.assignedCategory||'C',pkg=packageById(p.mealPackageId||'3m1s'),calcTime=n.calculatedAt?new Date(n.calculatedAt).toLocaleString():new Date().toLocaleString(),pkgRec=p.caloriePackageRecommendation||{calories:n.systemRecommendedCalories||h.calories||0,recommended:recommendMealPackage(n.systemRecommendedCalories||h.calories||0),belowNeed:false};
  const allergies=(p.allergies||[]).filter(Boolean),dislikes=(p.dislikes||[]).filter(Boolean),medical=(p.medical||[]).filter(x=>x&&x!=='None');
  const paymentStatus=payment.status||p.paymentStatus||'Awaiting Payment';
  const proof=paymentProofPreview(payment);
  const personal=reviewCard(1,'Personal Information',reviewRows([['Full Name',reviewSafe(p.name)],['Phone Verification',phoneVerificationPill(p)],['Date of Birth',reviewSafe(displayBirthDate(h.birthDate||''))+(h.age?' ('+h.age+' years)':'')],['Gender',reviewSafe(h.gender)],['Nationality',reviewSafe(p.nationality||'Not set')],['Preferred Language',reviewSafe(p.language||'English')]]),'personal');
  const body=reviewCard(2,'Goal & Body Information',reviewRows([['Goal','<span class="review-green-text">'+reviewSafe(p.goal)+'</span>'],['Activity Level',reviewSafe(n.activityLevel||p.activityLevel)],['Height',h.height?reviewSafe(h.height+' cm'):'-'],['Current Weight',h.weight?reviewSafe(h.weight+' kg'):'-'],['Target Weight',h.targetWeight?reviewSafe(h.targetWeight+' kg'):'-'],['BMI',reviewSafe(h.bmi)],['BMI Classification',reviewStatusPill(h.status||'Pending','warn')]]),'body');
  const diet=reviewCard(3,'Diet Preference',reviewRows([['Diet Preference',reviewSafe(p.dietPreference||'Balanced')],['Dietary Restrictions',reviewSafe(p.dietaryRestrictions||'None')]]),'diet');
  const allergy=reviewCard(4,'Allergies & Dislikes','<div class="review-alert-line"><span>Allergies</span>'+(allergies.length?'<b>Allergy Alert</b>':'')+'</div>'+reviewTags(allergies,'danger')+'<div class="review-alert-line"><span>Dislikes</span></div>'+reviewTags(dislikes,'warning'),'allergies');
  const report=reviewCard(5,'Medical & Body Report',reviewRows([['Medical Conditions',reviewSafe(medical.join(', ')||'None')],['Medications',reviewSafe(p.medications||'None')],['Other Notes',reviewSafe(p.medicalNotes||'None')]])+bmiReportPreviewHtml(h.bmiReport,'pending',index)+'<div class="review-report-grid"><span>BMI: '+reviewSafe(rm.bmi||h.bmi)+'</span><span>Body Fat: '+(rm.bodyFat?reviewSafe(rm.bodyFat+'%'):'-')+'</span><span>Muscle: '+(rm.muscle?reviewSafe(rm.muscle+' kg'):'-')+'</span><span>BMR: '+(rm.bmr?reviewSafe(rm.bmr+' kcal'):'-')+'</span></div>','medical');
  const nutrition='<section class="review-approval-card review-nutrition-card"><div class="review-approval-card-head"><h3>6. Automatic Nutrition Recommendation</h3><span class="review-status-pill good">System Generated</span></div><div class="review-nutrition-grid"><div class="review-calc-panel"><b>Calculation Summary</b>'+reviewRows([['BMR (Resting Energy)',n.calculatedBmr?Math.round(n.calculatedBmr)+' kcal':'-'],['Activity Multiplier',reviewSafe(n.activityMultiplier)],['Maintenance Calories (TDEE)',n.calculatedMaintenanceCalories?Math.round(n.calculatedMaintenanceCalories)+' kcal':'-'],['Goal Adjustment',(n.goalAdjustmentPercentage>0?'+':'')+(n.goalAdjustmentPercentage??'-')+'%']])+'<div class="review-system-calorie"><span>System Recommended Calories</span><strong>'+(n.systemRecommendedCalories||'-')+' kcal</strong></div><div class="review-info-note">Automatic recommendation only. Final plan must be reviewed and approved by CEO/Admin or Nutrition Team.</div></div><div class="review-macro-panel"><b>Macronutrients (System Recommendation)</b>'+nutritionDonutHtml(n)+'<div class="review-macro-tiles"><article><span>Calories</span><strong>'+(n.systemRecommendedCalories||'-')+'</strong><small>kcal</small></article><article><span>P</span><strong>'+(n.systemRecommendedProtein||'-')+'</strong><small>g</small></article><article><span>C</span><strong>'+(n.systemRecommendedCarbs||'-')+'</strong><small>g</small></article><article><span>F</span><strong>'+(n.systemRecommendedFat||'-')+'</strong><small>g</small></article></div></div></div></section>';
  const category='<section class="review-approval-card review-category-card"><div class="review-approval-card-head"><h3>7. Kitchen Category</h3><button type="button" class="review-edit-btn" data-review-edit="category">Edit</button></div><div class="review-category-grid"><div class="review-suggested-category"><span>System Suggested Category</span><strong>'+reviewSafe(rec)+'</strong><small>'+reviewSafe(reviewMacroText(rec))+'</small></div><label><span>Approved Category (CEO/Admin)</span><select id="reviewCategory">'+mealCategories.map(x=>'<option value="'+x[0]+'" '+(x[0]===rec?'selected':'')+'>Category '+x[0]+' - '+x[1]+'g/'+x[2]+'g cooked portions</option>').join('')+'</select></label><label><span>Category Notes</span><textarea id="reviewNutritionNotes" maxlength="200" placeholder="Add notes about category...">'+escHtml(n.nutritionNotes||'')+'</textarea></label></div><div class="review-approved-macros"><label><span>Approved Calories</span><input id="reviewCalories" type="number" min="0" value="'+escAttr(n.approvedCalories||h.calories||n.systemRecommendedCalories||'')+'"></label><label><span>Approved Protein</span><input id="reviewProtein" type="number" min="0" value="'+escAttr(n.approvedProtein||n.systemRecommendedProtein||'')+'"></label><label><span>Approved Carbs</span><input id="reviewCarbs" type="number" min="0" value="'+escAttr(n.approvedCarbs||n.systemRecommendedCarbs||'')+'"></label><label><span>Approved Fat</span><input id="reviewFat" type="number" min="0" value="'+escAttr(n.approvedFat||n.systemRecommendedFat||'')+'"></label></div></section>';
  const pack=reviewCard(8,'Package & Subscription',reviewRows([['Calculated Calories',pkgRec.calories?reviewSafe(pkgRec.calories+' kcal/day'):'-'],['System Recommended',reviewSafe(pkgRec.recommended?.packageName||'-')],['Customer Selected',reviewSafe(pkg.label)],['Recommendation Status',pkgRec.recommended?.custom?reviewStatusPill('Custom review required','warn'):(pkgRec.belowNeed?reviewStatusPill('Below recommendation','warn'):reviewStatusPill('Within range','good'))],['Meal Package',reviewSafe(pkg.custom?'Custom Plan':'Standard Plan')],['Meals / Day',reviewSafe(pkg.label)],['Subscription Package',reviewSafe(p.plan||packagePlanName(p.mealPackageId))],['Start Date (Requested)',reviewSafe(p.subscriptionStart)],['Start Date (Approved)','-'],['End Date','-'],['Remaining Days','Pending approval'],['Trial Status',reviewSafe(p.trialStatus||'Not Started')],['Status',reviewStatusPill('Pending Approval','warn')]]),'package');
  const pay=reviewCard(9,'Payment Information',reviewRows([['Payment Status',reviewStatusPill(paymentStatus,'blue')],['Payment Method',reviewSafe(payment.method||'Not selected')],['Amount',money(payment.amount||pkg.price||0)],['Transaction ID',reviewSafe(payment.transactionId)]])+reviewRows([['Payment Screenshot',proof]])+'<div class="review-split-actions"><button type="button" class="primary-btn green approval-verify-payment">Verify Payment</button><button type="button" class="primary-btn danger approval-reject-payment">Reject Payment</button></div>','payment');
  const delivery=reviewCard(10,'Delivery Information',reviewRows([['Delivery Place',reviewSafe(p.deliveryPreference)],['Zone / Area',reviewSafe(zoneShort(p.zone))+' / '+reviewSafe(p.area)],['Street / Building',reviewSafe([p.streetNumber?'Street '+p.streetNumber:'',p.buildingNumber?'Building '+p.buildingNumber:''].filter(Boolean).join(' / ')||'-')],['Floor / Unit',reviewSafe([p.floorNumber?'Floor '+p.floorNumber:'',p.unitNumber?'Unit '+p.unitNumber:''].filter(Boolean).join(' / ')||'-')],['Address',reviewSafe(p.address)],['Google Location','<a class="map-link" target="_blank" href="'+(p.googleLocation||mapsLink(p.area,p.address))+'">View on Map</a>'],['Preferred Time',reviewSafe(p.deliveryTime)],['Assigned Driver',reviewSafe(p.driverOverride||assignedDriver(p.zone))],['Delivery Notes',reviewSafe(p.deliveryNote||'Leave at the door')]]),'delivery');
  const notes='<section class="review-approval-card review-notes-card"><div class="review-approval-card-head"><h3>11. Notes</h3><button type="button" class="review-edit-btn" data-review-edit="notes">Edit</button></div><div class="review-note-grid">'+reviewNoteCard('Customer Notes',p.customerNote||'Registration submitted from customer portal.')+reviewNoteCard('Kitchen Notes',p.notes||'No kitchen notes')+reviewNoteCard('Nutrition Notes',n.nutritionNotes||'Pending nutrition review')+reviewNoteCard('Delivery Notes',p.deliveryNote||'No delivery note')+reviewNoteCard('Admin Internal Notes',p.internalNote||'Pending CEO/Admin approval')+'</div></section>';
  const history='<section class="review-approval-card review-history-card"><div class="review-approval-card-head"><h3>12. History & Activity</h3><span class="review-status-pill blue">Audit Trail</span></div>'+table(['Date & Time','Action','Details','Changed By'],reviewHistoryRows(p))+'</section>';
  const actions=reviewCard(13,'Action Center',pendingReviewActionsHtml(index),'actions');
  return '<section class="review-approval-page"><div class="review-titlebar"><div><h2>Customer Review & Nutrition Approval</h2>'+reviewStatusPill('Pending Approval','warn')+'</div><div class="review-top-actions"><button class="primary-btn green approve-customer" data-pending-index="'+index+'">Approve Customer</button><button class="primary-btn green save-pending-review" data-pending-index="'+index+'">Approve Nutrition Plan</button><button class="primary-btn light" data-review-edit="personal">Edit Customer</button><button class="primary-btn danger remove-pending" data-pending-index="'+index+'">Reject Customer</button><button class="primary-btn light" id="backPendingList">Back</button></div></div><div class="review-summary-card"><div class="review-avatar">'+reviewSafe((p.name||'C').trim().charAt(0).toUpperCase())+'</div><div class="review-summary-main"><h1>'+reviewSafe(p.name)+'</h1>'+reviewStatusPill('New Registration','good')+reviewRows([['Customer ID',reviewSafe(reviewPersonId(p,index))],['Registered',reviewSafe(calcTime)],['Last Updated',reviewSafe(calcTime)]])+'</div><div>'+reviewRows([['Phone',reviewSafe(p.phone)],['Phone Verification',phoneVerificationPill(p)],['WhatsApp','Preferred'],['Language',reviewSafe(p.language||'English')],['Location',reviewSafe((p.area||'-')+', Qatar')]])+'</div><div>'+reviewRows([['Status',reviewStatusPill('Pending Approval','warn')],['Assigned Admin',reviewSafe(roles[state.role]?.label||'Boss Admin')],['Source','Website'],['Customer Since',new Date().toLocaleDateString('en-GB')]])+'</div></div><div class="review-three-column"><div class="review-left-column">'+personal+body+diet+allergy+report+'</div><div class="review-center-column">'+nutrition+category+notes+history+'</div><div class="review-right-column">'+pack+pay+delivery+actions+'</div></div><footer class="review-approval-footer"><span>System values are automatic recommendations only. Final plan must be reviewed and approved by CEO/Admin or Nutrition Team.</span><span>Calculated At: '+reviewSafe(calcTime)+'</span><span>Calculated By: System</span><span>Approved By: -</span><span>Approved At: -</span></footer></section>'
};
bindPendingApprovals=function(){
  document.querySelectorAll('.review-pending').forEach(btn=>btn.addEventListener('click',()=>openPendingReview(btn.dataset.pendingIndex)));
  document.querySelectorAll('.save-pending-review').forEach(btn=>btn.addEventListener('click',()=>{const p=savePendingReviewEdits(btn.dataset.pendingIndex);if(p){p.reviewHistory=p.reviewHistory||[];p.reviewHistory.unshift({time:new Date().toLocaleString(),action:'Nutrition Approved',details:'Nutrition plan approved from review page',by:roles[state.role]?.label||'CEO/Admin'});const list=pendingCustomers();list[Number(btn.dataset.pendingIndex)]=p;savePendingCustomers(list);toast('Nutrition plan approved: Category '+p.cat)}}));
  document.querySelectorAll('.approve-customer').forEach(btn=>btn.addEventListener('click',()=>approvePendingCustomer(btn.dataset.pendingIndex)));
  document.querySelectorAll('.remove-pending').forEach(btn=>btn.addEventListener('click',()=>removePendingCustomer(btn.dataset.pendingIndex)));
  document.querySelectorAll('[data-review-edit]').forEach(btn=>btn.addEventListener('click',()=>{const root=btn.closest('.review-approval-page');const approve=root?.querySelector('.approve-customer');const index=approve?.dataset.pendingIndex||btn.dataset.pendingIndex||'0';openReviewEditModal(index,btn.dataset.reviewEdit)}));
  document.querySelectorAll('.action-start-trial').forEach(btn=>btn.addEventListener('click',()=>toast('Approve Customer first. Trial Day starts automatically after approval.')));
  document.querySelectorAll('.action-pause-subscription').forEach(btn=>btn.addEventListener('click',()=>toast('Pause is available after customer activation.')));
  document.querySelectorAll('.action-more-info').forEach(btn=>btn.addEventListener('click',()=>toast('More information request noted for follow-up.')));
  document.querySelectorAll('.approval-verify-payment').forEach(btn=>btn.addEventListener('click',()=>{const root=btn.closest('.review-approval-page');const index=root?.querySelector('.approve-customer')?.dataset.pendingIndex;if(index!==undefined){savePendingReviewPatch(index,{payment:{status:'Waiting Admin Approval'},root:{paymentStatus:'Waiting Admin Approval'}},'Payment moved to verification');openCustomerReviewDetail(index);toast('Payment moved to verification')}}));
  document.querySelectorAll('.approval-reject-payment').forEach(btn=>btn.addEventListener('click',()=>{const root=btn.closest('.review-approval-page');const index=root?.querySelector('.approve-customer')?.dataset.pendingIndex;if(index!==undefined){savePendingReviewPatch(index,{payment:{status:'Rejected'},root:{paymentStatus:'Rejected'}},'Payment proof rejected');openCustomerReviewDetail(index);toast('Payment proof rejected')}}));
  document.querySelectorAll('.open-bmi-report').forEach(btn=>btn.addEventListener('click',()=>openBmiReportModal(btn.dataset.reportSource,btn.dataset.reportIndex)));
};
renderMealPlans=function(){state.module='mealplans';const editable=canEdit();moduleFrame('Meal Plans','',kpis([['Categories','6'],['Menu Days','6 + Friday'],['Breakfast/Snack','Standard'],['Lunch/Dinner','Category Based']])+'<div class="two-col"><section class="panel"><div class="panel-header"><h2>Meal Categories</h2><span class="sub">Exact category rules</span></div>'+table(['Category','Protein','Carbs','Notes'],mealCategories.map((c,i)=>[badge(c[0],i),c[1]+'g',c[2]+'g',c[3]]))+'</section><section class="panel"><div class="panel-header"><h2>Category Calculator</h2></div><div class="form"><label><span>Category</span><select id="calcCat">'+mealCategories.map(c=>'<option>'+c[0]+'</option>').join('')+'</select></label><label><span>Total Meals</span><input id="calcMeals" type="number" value="25"></label><button class="primary-btn" id="calcBtn">Calculate Kitchen Quantity</button></div><div id="calcOut" class="card" style="margin-top:10px"></div></section></div><section class="panel" style="margin-top:14px"><div class="panel-header"><div><h2>Current Confirmed Menu</h2><span class="sub">Boss/Admin can change any dish here. Customers and kitchen will use the updated names.</span></div></div>'+weeklyMenuHtml()+'</section><section class="panel" style="margin-top:14px"><div class="panel-header"><div><h2>Edit Current Menu</h2><span class="sub">Change Breakfast, Lunch, Dinner and Snack options for each day.</span></div></div>'+menuEditorHtml(editable)+'</section><section class="panel explore-admin-panel" style="margin-top:14px"><div class="panel-header"><div><h2>Explore Menu</h2><span class="sub">Customer preview menu shown before registration. CEO/Admin can edit names and image links.</span></div><button type="button" class="primary-btn light" data-explore-menu>Open Preview</button></div>'+exploreMenuEditorHtml(editable)+'</section>');$('#calcBtn').addEventListener('click',calcCategory);calcCategory();bindMenuEditor();bindExploreMenuEditor()};
bindStaffLogin();
window.openStaffAccount=openStaffAccount;
window.staffLoginClick=staffLoginClick;


