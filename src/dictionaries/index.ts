export type Dictionary = {
  lang: string;
  dir: "ltr" | "rtl";
  navbar: {
    links: { href: string; label: string }[];
    cta: string;
    langLabel: string;
    langHref: string;
  };
  hero: {
    badge: string;
    title1: string;
    titleHighlight: string;
    title2: string;
    subtitle: string;
    cta1: string;
    cta2: string;
    virtualSub: string;
    virtualLabel: string;
    badgeStudents: string;
    badgeSub: string;
    stats: { v: string; l: string }[];
  };
  about: {
    tag: string;
    title: string;
    p1: string;
    p2: string;
    cta: string;
    missionTitle: string;
    missionText: string;
    advantages: string[];
  };
  formations: {
    tag: string;
    title: string;
    subtitle: string;
    cta: string;
    list: { title: string; desc: string; items: string[] }[];
  };
  advantages: {
    tag: string;
    title: string;
    subtitle: string;
    items: { title: string; desc: string }[];
  };
  gallery: {
    tag: string;
    title: string;
    subtitle: string;
    photos: { title: string; desc: string }[];
  };
  testimonials: {
    tag: string;
    title: string;
    subtitle: string;
    reviews: { name: string; course: string; text: string }[];
  };
  process: {
    tag: string;
    title: string;
    steps: { title: string; desc: string }[];
  };
  contact: {
    tag: string;
    title: string;
    subtitle: string;
    address: string;
    phone: string;
    email: string;
    mapTitle: string;
    formTitle: string;
    placeholders: {
      prenom: string; nom: string; tel: string; email: string;
      formation: string; niveau: string; message: string;
    };
    levels: string[];
    formations: string[];
    consent: string;
    submit: string;
    success: string;
    social: string;
    cardLabels: { address: string; phone: string; email: string };
  };
  cta: { title: string; subtitle: string; cta: string };
  footer: {
    tagline: string;
    about: string;
    aboutLinks: string[];
    formations: string;
    formationLinks: string[];
    contact: string;
    copyright: string;
  };
};

export const fr: Dictionary = {
  lang: "fr",
  dir: "ltr",
  navbar: {
    links: [
      { href: "#accueil", label: "Accueil" },
      { href: "#formations", label: "Formations" },
      { href: "#avantages", label: "Avantages" },
      { href: "#galerie", label: "Galerie" },
      { href: "#temoignages", label: "Témoignages" },
      { href: "#apropos", label: "À propos" },
      { href: "#contact", label: "Contact" },
    ],
    cta: "S'inscrire",
    langLabel: "عربي",
    langHref: "/ar",
  },
  hero: {
    badge: "Inscriptions ouvertes — Rentrée 2026",
    title1: "Développez vos",
    titleHighlight: "compétences",
    title2: "avec Leader School",
    subtitle: "Formations professionnelles en langues vivantes, informatique et cuisine. Rejoignez des centaines d'étudiants satisfaits à Kélibia.",
    cta1: "Commencer maintenant",
    cta2: "Découvrir les formations",
    virtualSub: "Découvrez",
    virtualLabel: "Visite virtuelle du centre",
    badgeStudents: "+500 étudiants",
    badgeSub: "formés cette année",
    stats: [
      { v: "90%", l: "Recommandation" },
      { v: "24", l: "Avis vérifiés" },
      { v: "100%", l: "Pratique" },
    ],
  },
  about: {
    tag: "Qui sommes-nous",
    title: "Un centre dédié à votre excellence",
    p1: "Leader School Kélibia est un centre de formation professionnel dédié à l'excellence académique et au développement des compétences pratiques. Avec une équipe de formateurs qualifiés et expérimentés, nous offrons des formations adaptées à vos besoins.",
    p2: "Notre approche pédagogique unique combine théorie solide et pratique intensive pour préparer nos étudiants au monde professionnel.",
    cta: "En savoir plus",
    missionTitle: "Notre Mission",
    missionText: "Former la nouvelle génération de professionnels en alliant savoir-faire et passion. Chaque parcours est conçu pour faire émerger votre plein potentiel.",
    advantages: ["Formation 100% pratique", "Stages garantis en entreprise", "Certificats professionnels reconnus"],
  },
  formations: {
    tag: "Nos formations",
    title: "Trois domaines, un avenir",
    subtitle: "Choisissez le parcours qui correspond à votre passion et à vos ambitions professionnelles.",
    cta: "Découvrir",
    list: [
      {
        title: "Langues Vivantes",
        desc: "Maîtrisez une nouvelle langue avec des formateurs natifs et certifiés.",
        items: ["Français", "Anglais", "Allemand", "Italien", "Espagnol", "Turc"],
      },
      {
        title: "Informatique & Design",
        desc: "Devenez créateur numérique avec des outils professionnels modernes.",
        items: ["Web Design", "Programmation", "Infographie", "Outils numériques"],
      },
      {
        title: "Cuisine & Pâtisserie",
        desc: "Apprenez l'art culinaire dans nos laboratoires entièrement équipés.",
        items: ["Cuisine générale", "Pâtisserie professionnelle", "Cuisine spécialisée"],
      },
    ],
  },
  advantages: {
    tag: "Pourquoi nous choisir",
    title: "Une expérience qui fait la différence",
    subtitle: "Quatre piliers qui font de Leader School Kélibia votre meilleur choix de formation.",
    items: [
      { title: "Formation 100% Pratique", desc: "Formation basée sur la pratique réelle, dans des conditions professionnelles." },
      { title: "Stages Garantis", desc: "Une opportunité de stage en entreprise à la fin de chaque formation." },
      { title: "Certificats Reconnus", desc: "Recevez un certificat professionnel valorisé par les recruteurs." },
      { title: "Formateurs Qualifiés", desc: "Des experts passionnés dans leurs domaines, à votre écoute." },
    ],
  },
  gallery: {
    tag: "Galerie",
    title: "Nos formations en action",
    subtitle: "Des moments de partage, de découverte et de réussite capturés dans notre centre.",
    photos: [
      { title: "Cours de langues", desc: "Petits groupes, immersion totale" },
      { title: "Atelier pâtisserie", desc: "Création de desserts signature" },
      { title: "Cuisine professionnelle", desc: "Équipements aux normes" },
      { title: "Programmation", desc: "Code en conditions réelles" },
      { title: "Web Design", desc: "Outils créatifs modernes" },
      { title: "Salles d'étude", desc: "Un cadre propice à la réussite" },
    ],
  },
  testimonials: {
    tag: "Témoignages",
    title: "Ce que disent nos étudiants",
    subtitle: "Une note moyenne de 4.9/5 sur 24 avis vérifiés.",
    reviews: [
      { name: "Yasmine B.", course: "Anglais — Niveau B2", text: "Excellente formation, formateurs très compétents et disponibles. J'ai gagné en confiance à l'oral." },
      { name: "Mohamed K.", course: "Web Design", text: "J'ai vraiment progressé en peu de temps. Le suivi personnalisé fait toute la différence." },
      { name: "Salma R.", course: "Pâtisserie professionnelle", text: "Un environnement d'apprentissage exceptionnel. Aujourd'hui je travaille dans un grand hôtel." },
    ],
  },
  process: {
    tag: "Comment ça marche",
    title: "Quatre étapes simples",
    steps: [
      { title: "Inscription", desc: "Inscrivez-vous gratuitement en quelques clics." },
      { title: "Paiement", desc: "Choisissez et payez l'offre qui vous correspond." },
      { title: "Accès", desc: "Accédez aux formations et ressources pédagogiques." },
      { title: "Certification", desc: "Obtenez votre certificat professionnel reconnu." },
    ],
  },
  contact: {
    tag: "Contact",
    title: "Parlons de votre projet",
    subtitle: "Notre équipe vous répond sous 24h ouvrées. Rendez-vous sur place ou à distance.",
    address: "Avenue Docteur Ibrahim Gharbi, Kélibia",
    phone: "+216 56 150 001",
    email: "Leaderschoolkelibia@gmail.com",
    mapTitle: "Localisation Leader School Kélibia",
    formTitle: "Demande d'inscription",
    placeholders: {
      prenom: "Prénom", nom: "Nom", tel: "Téléphone", email: "Email",
      formation: "Formation choisie", niveau: "Niveau", message: "Votre message (optionnel)",
    },
    levels: ["Débutant", "Intermédiaire", "Avancé"],
    formations: ["Français", "Anglais", "Allemand", "Italien", "Espagnol", "Turc", "Web Design", "Programmation", "Infographie", "Cuisine générale", "Pâtisserie professionnelle"],
    consent: "J'accepte les conditions d'utilisation et la politique de confidentialité.",
    submit: "S'inscrire",
    success: "Merci ! Votre demande a été enregistrée — nous vous recontactons sous 24h.",
    social: "Suivez-nous",
    cardLabels: { address: "Adresse", phone: "Téléphone", email: "Email" },
  },
  cta: {
    title: "Prêt à rejoindre Leader School ?",
    subtitle: "Inscrivez-vous dès maintenant et donnez un nouvel élan à votre parcours professionnel.",
    cta: "S'inscrire maintenant",
  },
  footer: {
    tagline: "Centre de formation professionnelle dédié à l'excellence et à la réussite de chaque étudiant.",
    about: "À propos",
    aboutLinks: ["Qui sommes-nous", "Notre mission", "Nos valeurs"],
    formations: "Formations",
    formationLinks: ["Langues vivantes", "Informatique & Design", "Cuisine & Pâtisserie"],
    contact: "Contact",
    copyright: "© 2026 Leader School Kélibia. Tous droits réservés.",
  },
};

export const ar: Dictionary = {
  lang: "ar",
  dir: "rtl",
  navbar: {
    links: [
      { href: "#accueil", label: "الرئيسية" },
      { href: "#formations", label: "التكوين" },
      { href: "#avantages", label: "المزايا" },
      { href: "#galerie", label: "المعرض" },
      { href: "#temoignages", label: "الشهادات" },
      { href: "#apropos", label: "من نحن" },
      { href: "#contact", label: "اتصل بنا" },
    ],
    cta: "سجّل الآن",
    langLabel: "FR",
    langHref: "/fr",
  },
  hero: {
    badge: "التسجيلات مفتوحة — دورة 2026",
    title1: "طوّر",
    titleHighlight: "مهاراتك",
    title2: "مع Leader School",
    subtitle: "تكوينات مهنية في اللغات الحية والإعلامية والطبخ. انضم إلى مئات الطلاب الراضين في قليبية.",
    cta1: "ابدأ الآن",
    cta2: "اكتشف التكوينات",
    virtualSub: "اكتشف",
    virtualLabel: "جولة افتراضية في المركز",
    badgeStudents: "+500 طالب",
    badgeSub: "تكوّنوا هذا العام",
    stats: [
      { v: "90%", l: "توصية" },
      { v: "24", l: "تقييم موثق" },
      { v: "100%", l: "تطبيقي" },
    ],
  },
  about: {
    tag: "من نحن",
    title: "مركز مكرّس لتميّزك",
    p1: "مدرسة ليدر قليبية مركز تكوين مهني مكرّس للتميز الأكاديمي وتطوير الكفاءات العملية. بفريق من المكوّنين المؤهلين والمتمرسين، نقدم تكوينات مصممة وفق احتياجاتك.",
    p2: "نهجنا البيداغوجي الفريد يجمع بين النظرية الراسخة والتطبيق المكثف لإعداد طلابنا للعالم المهني.",
    cta: "اعرف أكثر",
    missionTitle: "مهمتنا",
    missionText: "تكوين الجيل الجديد من المهنيين بالجمع بين المعرفة والشغف. كل مسار مصمم لإبراز إمكاناتك الكاملة.",
    advantages: ["تكوين 100% تطبيقي", "تربص مضمون في المؤسسات", "شهادات مهنية معترف بها"],
  },
  formations: {
    tag: "تكويناتنا",
    title: "ثلاثة مجالات، مستقبل واحد",
    subtitle: "اختر المسار الذي يتوافق مع شغفك وطموحاتك المهنية.",
    cta: "اكتشف",
    list: [
      {
        title: "اللغات الحية",
        desc: "أتقن لغة جديدة مع مكوّنين أصليين ومعتمدين.",
        items: ["الفرنسية", "الإنجليزية", "الألمانية", "الإيطالية", "الإسبانية", "التركية"],
      },
      {
        title: "الإعلامية والتصميم",
        desc: "كن مبدعاً رقمياً باستخدام أدوات احترافية حديثة.",
        items: ["تصميم الويب", "البرمجة", "الإنفوغرافيك", "الأدوات الرقمية"],
      },
      {
        title: "الطبخ والحلويات",
        desc: "تعلم فن الطهي في مختبراتنا المجهزة بالكامل.",
        items: ["الطبخ العام", "الحلويات المهنية", "الطبخ المتخصص"],
      },
    ],
  },
  advantages: {
    tag: "لماذا تختارنا",
    title: "تجربة تُحدث الفرق",
    subtitle: "أربعة ركائز تجعل من مدرسة ليدر قليبية خيارك الأفضل للتكوين.",
    items: [
      { title: "تكوين 100% تطبيقي", desc: "تكوين مبني على الممارسة الفعلية في ظروف مهنية." },
      { title: "تربص مضمون", desc: "فرصة تربص في مؤسسة في نهاية كل تكوين." },
      { title: "شهادات معترف بها", desc: "احصل على شهادة مهنية معترف بها لدى أصحاب العمل." },
      { title: "مكوّنون مؤهلون", desc: "خبراء متحمسون في مجالاتهم، في خدمتك." },
    ],
  },
  gallery: {
    tag: "المعرض",
    title: "تكويناتنا في الميدان",
    subtitle: "لحظات من المشاركة والاكتشاف والنجاح ملتقطة في مركزنا.",
    photos: [
      { title: "دروس اللغات", desc: "مجموعات صغيرة، انغماس كامل" },
      { title: "ورشة الحلويات", desc: "إنشاء حلويات مميزة" },
      { title: "الطبخ المهني", desc: "معدات وفق المعايير" },
      { title: "البرمجة", desc: "برمجة في ظروف حقيقية" },
      { title: "تصميم الويب", desc: "أدوات إبداعية حديثة" },
      { title: "قاعات الدراسة", desc: "إطار ملائم للنجاح" },
    ],
  },
  testimonials: {
    tag: "الشهادات",
    title: "ما يقوله طلابنا",
    subtitle: "معدل 4.9/5 على أساس 24 تقييم موثق.",
    reviews: [
      { name: "ياسمين ب.", course: "الإنجليزية — مستوى B2", text: "تكوين ممتاز، مكوّنون أكفاء ومتاحون. اكتسبت ثقة في التحدث الشفهي." },
      { name: "محمد ك.", course: "تصميم الويب", text: "تقدمت كثيراً في وقت قصير. المتابعة الشخصية تحدث كل الفرق." },
      { name: "سلمى ر.", course: "الحلويات المهنية", text: "بيئة تعليمية استثنائية. اليوم أعمل في فندق كبير." },
    ],
  },
  process: {
    tag: "كيف يعمل",
    title: "أربع خطوات بسيطة",
    steps: [
      { title: "التسجيل", desc: "سجّل مجاناً في بضع نقرات." },
      { title: "الدفع", desc: "اختر وادفع العرض المناسب لك." },
      { title: "الوصول", desc: "تمتع بالوصول إلى التكوينات والموارد التعليمية." },
      { title: "التصديق", desc: "احصل على شهادتك المهنية المعترف بها." },
    ],
  },
  contact: {
    tag: "اتصل بنا",
    title: "تحدث عن مشروعك",
    subtitle: "يجيبك فريقنا خلال 24 ساعة عمل. تعال إلينا أو عن بُعد.",
    address: "شارع الدكتور إبراهيم الغربي، قليبية",
    phone: "+216 56 150 001",
    email: "Leaderschoolkelibia@gmail.com",
    mapTitle: "موقع مدرسة ليدر قليبية",
    formTitle: "طلب تسجيل",
    placeholders: {
      prenom: "الاسم الأول", nom: "اللقب", tel: "الهاتف", email: "البريد الإلكتروني",
      formation: "التكوين المختار", niveau: "المستوى", message: "رسالتك (اختياري)",
    },
    levels: ["مبتدئ", "متوسط", "متقدم"],
    formations: ["الفرنسية", "الإنجليزية", "الألمانية", "الإيطالية", "الإسبانية", "التركية", "تصميم الويب", "البرمجة", "الإنفوغرافيك", "الطبخ العام", "الحلويات المهنية"],
    consent: "أوافق على شروط الاستخدام وسياسة الخصوصية.",
    submit: "سجّل",
    success: "شكراً! تم تسجيل طلبك — سنتواصل معك خلال 24 ساعة.",
    social: "تابعنا",
    cardLabels: { address: "العنوان", phone: "الهاتف", email: "البريد الإلكتروني" },
  },
  cta: {
    title: "هل أنت مستعد للانضمام إلى Leader School؟",
    subtitle: "سجّل الآن وأعطِ دفعة جديدة لمسارك المهني.",
    cta: "سجّل الآن",
  },
  footer: {
    tagline: "مركز تكوين مهني مكرّس للتميز ونجاح كل طالب.",
    about: "من نحن",
    aboutLinks: ["التعريف بنا", "مهمتنا", "قيمنا"],
    formations: "التكوينات",
    formationLinks: ["اللغات الحية", "الإعلامية والتصميم", "الطبخ والحلويات"],
    contact: "اتصل بنا",
    copyright: "© 2026 مدرسة ليدر قليبية. جميع الحقوق محفوظة.",
  },
};
