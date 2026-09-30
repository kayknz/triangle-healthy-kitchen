import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface LegalPageProps {
  type: 'privacy' | 'terms';
}

export default function LegalPage({ type }: LegalPageProps) {
  const { isRtl } = useLanguage();
  const content = {
    privacy: {
      title: isRtl ? 'سياسة الخصوصية' : 'Privacy Policy',
      sections: [
        {
          heading: isRtl ? '١. جمع البيانات' : '1. Data Collection',
          body: isRtl
            ? 'نجمع المعلومات التي تقدمها عند التسجيل، مثل اسمك ورقم هاتفك وعنوانك وتفاصيل ملفك الصحي. وبموافقتك، يمكن للتطبيق قراءة الخطوات ومسافة المشي والطاقة النشطة والوزن من Apple Health على iPhone أو Health Connect على Android. ويمكن أن تصل بيانات Samsung Health عبر Health Connect بعد تفعيل المشاركة في تطبيق Samsung Health.'
            : 'We collect information you provide when registering, including your name, phone number, address, and health profile. If you choose to connect, the app reads steps, walking distance, active energy, and weight from Apple Health on iPhone or Health Connect on Android. Samsung Health data can flow through Health Connect after you enable sharing in Samsung Health.'
        },
        {
          heading: isRtl ? '٢. استخدام المعلومات' : '2. Use of Information',
          body: isRtl
            ? 'نستخدم بياناتك لتخصيص خطط الوجبات، ومعالجة الطلبات، والتواصل بشأن الاشتراك، وعرض تقدمك الصحي. لا تتم مزامنة بيانات الصحة إلا عندما تختار ذلك من التطبيق.'
            : 'We use your data to personalize meal plans, process orders, communicate about your subscription, and show your wellness progress. Health data is synced only when you choose to sync it in the app.'
        },
        {
          heading: isRtl ? '٣. حماية البيانات' : '3. Data Protection',
          body: isRtl
            ? 'نحمي معلوماتك باستخدام ضوابط الوصول والأمان في خدماتنا. تُرسل البيانات التي تختار مزامنتها إلى حسابك في Triangle Healthy Kitchen عبر Supabase لتظهر في تقدمك الصحي. لا نبيع البيانات الصحية ولا نستخدمها للإعلانات أو التسويق.'
            : 'We protect your information using access controls and security measures in our services. Health data you choose to sync is sent to your Triangle Healthy Kitchen account through Supabase so it can appear in your wellness progress. We do not sell health data or use it for advertising or marketing.'
        }
      ]
    },
    terms: {
      title: isRtl ? 'شروط الخدمة' : 'Terms of Service',
      sections: [
        {
          heading: isRtl ? '١. الاشتراكات' : '1. Subscriptions',
          body: isRtl
            ? 'يتم تجديد الاشتراكات شهرياً. يمكنك إلغاء أو إيقاف اشتراكك مؤقتاً من خلال لوحة تحكم المشترك.'
            : 'Subscriptions are renewed monthly. You can cancel or pause your subscription through the subscriber dashboard.'
        },
        {
          heading: isRtl ? '٢. التوصيل' : '2. Delivery',
          body: isRtl
            ? 'نحن نوصل الوجبات يومياً في الدوحة، قطر. يرجى التأكد من دقة تفاصيل العنوان والنافذة الزمنية للتوصيل.'
            : 'We deliver meals daily in Doha, Qatar. Please ensure your address details and delivery time windows are accurate.'
        },
        {
          heading: isRtl ? '٣. إخلاء المسؤولية الصحية' : '3. Health Disclaimer',
          body: isRtl
            ? 'خطط الوجبات لدينا هي نصائح غذائية وليست استبدالاً للاستشارة الطبية الاحترافية. استشر طبيبك دائماً قبل البدء في نظام غذائي جديد.'
            : 'Our meal plans are nutritional guidance and not a substitute for professional medical advice. Always consult your doctor before starting a new diet.'
        }
      ]
    }
  }[type];

  return (
    <main className="min-h-screen bg-[#0a3030] text-white px-6 py-32 sm:px-12" dir={isRtl ? 'rtl' : 'ltr'}>
      <article className="mx-auto max-w-3xl">
        <Link to="/" className="mb-12 inline-flex items-center gap-2 text-[#D4A843] hover:text-white">
          <ArrowLeft className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} />
          {isRtl ? 'العودة إلى الموقع' : 'Return to site'}
        </Link>
        <header className="mb-12 border-b border-white/10 pb-8">
          <h1 className="mb-4 text-4xl font-bold">{content.title}</h1>
          <p className="text-sm italic text-white/50">{isRtl ? 'آخر تحديث: سبتمبر ٢٠٢٦' : 'Last updated: September 2026'}</p>
        </header>
        <div className="space-y-10">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-4 text-xl font-bold uppercase tracking-wide text-[#D4A843]">{section.heading}</h2>
              <p className="text-lg leading-relaxed text-white/75">{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
