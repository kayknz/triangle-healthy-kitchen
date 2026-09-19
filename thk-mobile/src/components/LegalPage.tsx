import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface LegalPageProps {
  type: 'privacy' | 'terms';
  onBack: () => void;
}

export default function LegalPage({ type, onBack }: LegalPageProps) {
  const { t, isRtl } = useLanguage();

  const content = {
    privacy: {
      title: isRtl ? 'سياسة الخصوصية' : 'Privacy Policy',
      lastUpdated: 'August 2026',
      sections: [
        {
          h: isRtl ? '١. جمع البيانات' : '1. Data Collection',
          p: isRtl
            ? 'نحن نجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل، مثل اسمك ورقم هاتفك وعنوانك وتفاصيل ملفك الصحي (مثل الوزن والطول والحساسية).'
            : 'We collect information you provide directly to us when registering, such as your name, phone number, address, and health profile details (weight, height, allergies).'
        },
        {
          h: isRtl ? '٢. استخدام المعلومات' : '2. Use of Information',
          p: isRtl
            ? 'نستخدم بياناتك لتخصيص خطط الوجبات الخاصة بك، ومعالجة طلباتك، والتواصل معك بشأن اشتراكك.'
            : 'We use your data to personalize your meal plans, process your orders, and communicate with you about your subscription.'
        },
        {
          h: isRtl ? '٣. حماية البيانات' : '3. Data Protection',
          p: isRtl
            ? 'نحن نطبق تدابير أمنية لحماية معلوماتك الشخصية. لا نشارك بياناتك الصحية مع أطراف ثالثة لأغراض تسويقية.'
            : 'We implement security measures to protect your personal information. We do not share your health data with third parties for marketing purposes.'
        }
      ]
    },
    terms: {
      title: isRtl ? 'شروط الخدمة' : 'Terms of Service',
      lastUpdated: 'August 2026',
      sections: [
        {
          h: isRtl ? '١. الاشتراكات' : '1. Subscriptions',
          p: isRtl
            ? 'يتم تجديد الاشتراكات شهرياً. يمكنك إلغاء أو إيقاف اشتراكك مؤقتاً من خلال لوحة تحكم المشترك.'
            : 'Subscriptions are renewed monthly. You can cancel or pause your subscription through the subscriber dashboard.'
        },
        {
          h: isRtl ? '٢. التوصيل' : '2. Delivery',
          p: isRtl
            ? 'نحن نوصل الوجبات يومياً في الدوحة، قطر. يرجى التأكد من دقة تفاصيل العنوان والنافذة الزمنية للتوصيل.'
            : 'We deliver meals daily in Doha, Qatar. Please ensure your address details and delivery time windows are accurate.'
        },
        {
          h: isRtl ? '٣. إخلاء المسؤولية الصحية' : '3. Health Disclaimer',
          p: isRtl
            ? 'خطط الوجبات لدينا هي نصائح غذائية وليست استبدالاً للاستشارة الطبية الاحترافية. استشر طبيبك دائماً قبل البدء في نظام غذائي جديد.'
            : 'Our meal plans are nutritional guidance and not a substitute for professional medical advice. Always consult your doctor before starting a new diet.'
        }
      ]
    }
  };

  const active = content[type];

  return (
    <div className="min-h-screen bg-[#0a3030] text-white safe-top">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#D4A843] hover:text-[#c09535] mb-12 transition-colors group"
        >
          <ArrowLeft className={`w-5 h-5 transition-transform ${isRtl ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
          {t('back')}
        </button>

        <header className="mb-12 border-b border-white/10 pb-8">
          <h1 className="text-4xl font-bold mb-4">{active.title}</h1>
          <p className="text-white/40 text-sm italic">
            {isRtl ? 'آخر تحديث: ' : 'Last updated: '} {active.lastUpdated}
          </p>
        </header>

        <div className="space-y-10">
          {active.sections.map((s, i) => (
            <section key={i} className="reveal active">
              <h2 className="text-[#D4A843] font-bold text-xl mb-4 uppercase tracking-wide">{s.h}</h2>
              <p className="text-white/70 leading-relaxed text-lg">{s.p}</p>
            </section>
          ))}
        </div>

        <footer className="mt-20 pt-12 border-t border-white/10 text-center">
          <p className="text-white/30 text-sm">
            © 2026 Triangle Healthy Kitchen. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
