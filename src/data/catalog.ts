import coverTemplates from "@/assets/cover-templates.jpg";
import coverCourse from "@/assets/cover-course.jpg";
import coverDesign from "@/assets/cover-design.jpg";
import coverBusiness from "@/assets/cover-business.jpg";

export type Category = {
  slug: string;
  name: string;
};

export const productCategories: Category[] = [
  { slug: "templates", name: "টেমপ্লেট" },
  { slug: "ebook", name: "ই-বুক" },
  { slug: "design", name: "ডিজাইন অ্যাসেট" },
  { slug: "business", name: "বিজনেস টুল" },
];

export const courseCategories: Category[] = [
  { slug: "freelancing", name: "ফ্রিল্যান্সিং" },
  { slug: "design", name: "ডিজাইন" },
  { slug: "marketing", name: "মার্কেটিং" },
  { slug: "development", name: "ডেভেলপমেন্ট" },
];

export type Product = {
  slug: string;
  name: string;
  categorySlug: string;
  shortDescription: string;
  description: string[];
  includes: string[];
  fileInfo: string;
  price: number;
  originalPrice?: number;
  image: string;
  popular?: boolean;
  isNew?: boolean;
};

export type Lesson = {
  title: string;
  duration: string;
  free?: boolean;
};

export type Module = {
  title: string;
  lessons: Lesson[];
};

export type Course = {
  slug: string;
  name: string;
  categorySlug: string;
  level: "beginner" | "intermediate" | "advanced";
  instructor: string;
  shortDescription: string;
  description: string[];
  outcomes: string[];
  lessonCount: number;
  duration: string;
  price: number;
  originalPrice?: number;
  image: string;
  modules: Module[];
  popular?: boolean;
  isNew?: boolean;
};

export const levelLabels: Record<Course["level"], string> = {
  beginner: "প্রাথমিক",
  intermediate: "মধ্যম",
  advanced: "অ্যাডভান্সড",
};

export const products: Product[] = [
  {
    slug: "business-template-pack",
    name: "বিজনেস টেমপ্লেট প্যাক",
    categorySlug: "templates",
    shortDescription: "ইনভয়েস, প্রস্তাবনা ও রিপোর্টের ৫০+ রেডি টেমপ্লেট।",
    description: [
      "ছোট ব্যবসা ও ফ্রিল্যান্সারদের জন্য তৈরি সম্পূর্ণ টেমপ্লেট প্যাক। ইনভয়েস, কোটেশন, প্রজেক্ট প্রস্তাবনা ও মাসিক রিপোর্ট—সবকিছু এক জায়গায়।",
      "প্রতিটি ফাইল সম্পূর্ণ এডিটযোগ্য, বাংলা ও ইংরেজি দুই ভাষাতেই ব্যবহার করা যায়।",
    ],
    includes: [
      "৫০+ এডিটযোগ্য টেমপ্লেট",
      "বাংলা ও ইংরেজি সংস্করণ",
      "লাইফটাইম আপডেট",
      "ব্যবহারের গাইডলাইন",
    ],
    fileInfo: "PDF, DOCX, XLSX — প্রায় ১২০ MB",
    price: 1500,
    originalPrice: 2500,
    image: coverBusiness,
    popular: true,
  },
  {
    slug: "freelancing-guide-ebook",
    name: "ফ্রিল্যান্সিং শুরুর গাইড (ই-বুক)",
    categorySlug: "ebook",
    shortDescription: "শূন্য থেকে প্রথম ক্লায়েন্ট পর্যন্ত ধাপে ধাপে বাংলা গাইড।",
    description: [
      "মার্কেটপ্লেস প্রোফাইল তৈরি, সার্ভিস নির্বাচন, প্রাইসিং ও ক্লায়েন্ট কমিউনিকেশন—সবকিছু বাস্তব উদাহরণসহ ব্যাখ্যা করা হয়েছে।",
      "বাংলাদেশি ফ্রিল্যান্সারদের জন্য পেমেন্ট ও ব্যাংকিং অংশ আলাদাভাবে যুক্ত আছে।",
    ],
    includes: ["১৮০ পৃষ্ঠার ই-বুক", "চেকলিস্ট ও ওয়ার্কশিট", "প্রস্তাবনার নমুনা"],
    fileInfo: "PDF — প্রায় ২৫ MB",
    price: 490,
    originalPrice: 890,
    image: coverTemplates,
    popular: true,
  },
  {
    slug: "social-media-design-kit",
    name: "সোশ্যাল মিডিয়া ডিজাইন কিট",
    categorySlug: "design",
    shortDescription: "ফেসবুক ও ইনস্টাগ্রামের জন্য ২০০+ পোস্ট ডিজাইন।",
    description: [
      "ব্যবসার দৈনন্দিন কনটেন্টের জন্য তৈরি আধুনিক ডিজাইন কিট। রং, ফন্ট ও লেআউট সহজেই বদলানো যায়।",
      "বাংলা টাইপোগ্রাফি মাথায় রেখে প্রতিটি লেআউট তৈরি করা হয়েছে।",
    ],
    includes: ["২০০+ পোস্ট টেমপ্লেট", "স্টোরি ও কভার ডিজাইন", "বাংলা ফন্ট গাইড"],
    fileInfo: "Figma, PSD — প্রায় ৩৫০ MB",
    price: 1200,
    image: coverDesign,
    isNew: true,
  },
  {
    slug: "accounting-sheet-pro",
    name: "হিসাব শিট প্রো",
    categorySlug: "business",
    shortDescription: "ছোট ব্যবসার আয়-ব্যয় ও মুনাফার অটোমেটেড শিট।",
    description: [
      "প্রতিদিনের বিক্রি, খরচ ও বকেয়া হিসাব রাখার সহজ শিট। সব হিসাব স্বয়ংক্রিয়ভাবে যোগ হয়ে মাসিক রিপোর্ট তৈরি করে।",
    ],
    includes: ["অটোমেটেড ড্যাশবোর্ড", "মাসিক ও বার্ষিক রিপোর্ট", "ভিডিও সেটআপ গাইড"],
    fileInfo: "XLSX, Google Sheets — প্রায় ১৫ MB",
    price: 850,
    originalPrice: 1200,
    image: coverBusiness,
    isNew: true,
  },
  {
    slug: "cv-portfolio-pack",
    name: "সিভি ও পোর্টফোলিও প্যাক",
    categorySlug: "templates",
    shortDescription: "চাকরি ও ক্লায়েন্টের জন্য পেশাদার সিভি টেমপ্লেট।",
    description: [
      "৩০টি আধুনিক সিভি ও পোর্টফোলিও লেআউট, সঙ্গে কভার লেটারের নমুনা।",
    ],
    includes: ["৩০টি সিভি ডিজাইন", "কভার লেটার নমুনা", "পোর্টফোলিও লেআউট"],
    fileInfo: "DOCX, PDF — প্রায় ৬০ MB",
    price: 390,
    originalPrice: 690,
    image: coverTemplates,
  },
  {
    slug: "brand-identity-kit",
    name: "ব্র্যান্ড আইডেন্টিটি কিট",
    categorySlug: "design",
    shortDescription: "লোগো, রং ও টাইপোগ্রাফির সম্পূর্ণ ব্র্যান্ড গাইড।",
    description: [
      "নতুন ব্যবসার ব্র্যান্ড দাঁড় করানোর জন্য প্রয়োজনীয় সব উপাদান এক প্যাকেজে।",
    ],
    includes: ["লোগো টেমপ্লেট", "ব্র্যান্ড গাইডলাইন", "সোশ্যাল কিট"],
    fileInfo: "AI, SVG, PDF — প্রায় ২০০ MB",
    price: 1900,
    originalPrice: 2900,
    image: coverDesign,
    popular: true,
  },
];

export const courses: Course[] = [
  {
    slug: "freelancing-mastery",
    name: "ফ্রিল্যান্সিং মাস্টারি",
    categorySlug: "freelancing",
    level: "beginner",
    instructor: "তানভীর হাসান",
    shortDescription: "মার্কেটপ্লেসে প্রোফাইল থেকে প্রথম আয় পর্যন্ত পূর্ণাঙ্গ কোর্স।",
    description: [
      "একদম শুরু থেকে ফ্রিল্যান্সিং শেখার কোর্স। সার্ভিস নির্বাচন, প্রোফাইল অপটিমাইজেশন, প্রপোজাল লেখা ও ক্লায়েন্ট ধরে রাখার কৌশল বাস্তব উদাহরণসহ শেখানো হয়েছে।",
      "প্রতিটি ক্লাস বাংলায়, ছোট ছোট ভিডিওতে ভাগ করা।",
    ],
    outcomes: [
      "নিজের সার্ভিস ও প্রাইসিং ঠিক করতে পারবেন",
      "পেশাদার প্রোফাইল ও পোর্টফোলিও তৈরি করতে পারবেন",
      "কার্যকর প্রপোজাল লিখতে পারবেন",
      "নিরাপদে পেমেন্ট গ্রহণ করতে পারবেন",
    ],
    lessonCount: 42,
    duration: "৮ ঘণ্টা ৩০ মিনিট",
    price: 2500,
    originalPrice: 4000,
    image: coverCourse,
    popular: true,
    modules: [
      {
        title: "শুরুর কথা",
        lessons: [
          { title: "ফ্রিল্যান্সিং আসলে কী", duration: "০৮:১২", free: true },
          { title: "সঠিক স্কিল নির্বাচন", duration: "১২:০৪" },
          { title: "সময় ব্যবস্থাপনা", duration: "০৯:৪০" },
        ],
      },
      {
        title: "প্রোফাইল ও পোর্টফোলিও",
        lessons: [
          { title: "প্রোফাইল অপটিমাইজেশন", duration: "১৪:২২" },
          { title: "পোর্টফোলিও সাজানো", duration: "১৬:১০" },
        ],
      },
      {
        title: "ক্লায়েন্ট ও পেমেন্ট",
        lessons: [
          { title: "প্রপোজাল লেখার কৌশল", duration: "১৮:৩৫" },
          { title: "বাংলাদেশে পেমেন্ট গ্রহণ", duration: "১১:৫০" },
        ],
      },
    ],
  },
  {
    slug: "graphic-design-complete",
    name: "গ্রাফিক ডিজাইন সম্পূর্ণ কোর্স",
    categorySlug: "design",
    level: "intermediate",
    instructor: "নুসরাত জাহান",
    shortDescription: "ডিজাইন থিওরি থেকে ক্লায়েন্ট প্রজেক্ট পর্যন্ত হাতে-কলমে শিক্ষা।",
    description: [
      "রং, টাইপোগ্রাফি ও লেআউটের মূলনীতি শিখে বাস্তব প্রজেক্টে প্রয়োগ করার কোর্স।",
    ],
    outcomes: [
      "ব্র্যান্ড ডিজাইন করতে পারবেন",
      "সোশ্যাল মিডিয়া কনটেন্ট তৈরি করতে পারবেন",
      "ক্লায়েন্ট ফাইল গুছিয়ে দিতে পারবেন",
    ],
    lessonCount: 56,
    duration: "১২ ঘণ্টা",
    price: 3200,
    originalPrice: 4500,
    image: coverDesign,
    popular: true,
    modules: [
      {
        title: "ডিজাইনের ভিত্তি",
        lessons: [
          { title: "রঙের ব্যবহার", duration: "১০:১৫", free: true },
          { title: "টাইপোগ্রাফি", duration: "১৩:৩০" },
        ],
      },
      {
        title: "প্রজেক্ট",
        lessons: [
          { title: "লোগো ডিজাইন প্রজেক্ট", duration: "২২:০৫" },
          { title: "ব্র্যান্ড গাইড তৈরি", duration: "১৯:৪৫" },
        ],
      },
    ],
  },
  {
    slug: "digital-marketing-bangla",
    name: "ডিজিটাল মার্কেটিং (বাংলা)",
    categorySlug: "marketing",
    level: "beginner",
    instructor: "সাকিব রহমান",
    shortDescription: "ফেসবুক ও গুগল অ্যাডে কার্যকর ক্যাম্পেইন চালানো শিখুন।",
    description: [
      "বাংলাদেশি ব্যবসার বাস্তব উদাহরণ দিয়ে ক্যাম্পেইন পরিকল্পনা, বাজেট ও রিপোর্টিং শেখানো হয়েছে।",
    ],
    outcomes: [
      "ফেসবুক অ্যাড ক্যাম্পেইন চালাতে পারবেন",
      "বাজেট ও রেজাল্ট হিসাব করতে পারবেন",
      "কনটেন্ট পরিকল্পনা করতে পারবেন",
    ],
    lessonCount: 38,
    duration: "৭ ঘণ্টা ১৫ মিনিট",
    price: 2200,
    image: coverBusiness,
    isNew: true,
    modules: [
      {
        title: "মার্কেটিং বেসিক",
        lessons: [
          { title: "টার্গেট অডিয়েন্স", duration: "০৯:২০", free: true },
          { title: "কনটেন্ট পরিকল্পনা", duration: "১২:৪০" },
        ],
      },
      {
        title: "পেইড অ্যাড",
        lessons: [
          { title: "ফেসবুক অ্যাড সেটআপ", duration: "২১:১০" },
          { title: "রিপোর্ট বিশ্লেষণ", duration: "১৪:০০" },
        ],
      },
    ],
  },
  {
    slug: "web-development-basics",
    name: "ওয়েব ডেভেলপমেন্ট বেসিকস",
    categorySlug: "development",
    level: "beginner",
    instructor: "ইমরান কবির",
    shortDescription: "HTML, CSS ও JavaScript দিয়ে প্রথম ওয়েবসাইট তৈরি করুন।",
    description: [
      "কোডিংয়ে সম্পূর্ণ নতুনদের জন্য ধাপে ধাপে বাংলা কোর্স, প্রতিটি অধ্যায়ে প্র্যাকটিস প্রজেক্ট।",
    ],
    outcomes: [
      "রেসপনসিভ ওয়েবপেজ তৈরি করতে পারবেন",
      "জাভাস্ক্রিপ্টের মূল ধারণা বুঝবেন",
      "প্রজেক্ট অনলাইনে প্রকাশ করতে পারবেন",
    ],
    lessonCount: 64,
    duration: "১৪ ঘণ্টা",
    price: 2900,
    originalPrice: 3900,
    image: coverCourse,
    modules: [
      {
        title: "HTML ও CSS",
        lessons: [
          { title: "প্রথম ওয়েবপেজ", duration: "১১:০৫", free: true },
          { title: "লেআউট ও রেসপনসিভ ডিজাইন", duration: "২৩:৪০" },
        ],
      },
      {
        title: "JavaScript",
        lessons: [
          { title: "ভ্যারিয়েবল ও ফাংশন", duration: "১৭:৩০" },
          { title: "ছোট প্রজেক্ট", duration: "২৫:১৫" },
        ],
      },
    ],
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getCourse(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function categoryName(list: Category[], slug: string): string {
  return list.find((c) => c.slug === slug)?.name ?? slug;
}
