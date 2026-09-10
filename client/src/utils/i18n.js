export const translations = {
  en: {
    brandName: "Social Media Sellers SaaS",
    brandSubtitle: "Social Media Seller Workspace",
    brandTagline: "Turn your Instagram, TikTok & WhatsApp buyers into instant orders",
    
    // Auth & Account
    loginTitle: "Welcome Back, Seller",
    loginSubtitle: "Log in to manage your products and social orders",
    registerTitle: "Create Seller Account",
    registerSubtitle: "Start selling on Instagram, TikTok & WhatsApp in minutes",
    storeNameLabel: "Store Name",
    emailLabel: "Email Address",
    passwordLabel: "Password (min 6 chars)",
    currencyLabel: "Store Currency",
    loginBtn: "Log In",
    loggingIn: "Logging In...",
    registerBtn: "Register Store",
    registering: "Creating Account...",
    logoutBtn: "Log Out",
    alreadyAccount: "Already have a seller account?",
    noAccount: "Don't have a store account yet?",
    loginHere: "Log In Here",
    registerHere: "Register Here",

    // Dashboard & KPIs
    activeItems: "Active Items",
    itemsListed: "Items listed in store",
    totalInventory: "Total Inventory",
    combinedStock: "Combined stock count",
    catalogValue: "Catalog Market Value",
    totalValueSubtext: "Total inventory market value",
    units: "units",

    // Product Management
    addNewProduct: "Add New Product",
    addSubtitle: "Create a listing to generate social order links",
    productTitleLabel: "Product Title *",
    priceLabel: "Price *",
    stockQtyLabel: "Stock Qty *",
    descLabel: "Description",
    descPlaceholder: "Describe material, sizing, or ordering details for Instagram/WhatsApp...",
    createListingBtn: "+ Create Product Listing",
    creatingListing: "Creating Listing...",

    // Catalog & Search
    catalogTitle: "Product Catalog",
    catalogSubtitle: "Manage prices, inventory, and social listings",
    searchPlaceholder: "Search catalog...",
    loadingCatalog: "Loading catalog items...",
    noProducts: "No products match your search",
    noProductsSubtext: "Add products using the form on the left to start building your catalog.",
    inStock: "in stock",
    outOfStock: "Out of stock",
    edit: "Edit",
    delete: "Delete",
    save: "Save Changes",
    cancel: "Cancel",
    confirmDelete: "Delete this item from your store catalog?",

    // Footers & Alerts
    rightsReserved: "Social Media Sellers SaaS Platform. All rights reserved.",
  },
  ar: {
    brandName: "منصة التجار عبر التواصل الاجتماعي",
    brandSubtitle: "مساحة عمل تاجر شبكات التواصل الاجتماعي",
    brandTagline: "حوّل متابعيك على إنستغرام وتيك توك وواتساب إلى طلبات فورية",
    
    // Auth & Account
    loginTitle: "أهلاً بك مجدداً، أيها التاجر",
    loginSubtitle: "سجل الدخول لإدارة منتجاتك وطلباتك",
    registerTitle: "إنشاء حساب تاجر جديد",
    registerSubtitle: "ابدأ البيع عبر إنستغرام وتيك توك وواتساب في دقائق",
    storeNameLabel: "اسم المتجر",
    emailLabel: "البريد الإلكتروني",
    passwordLabel: "كلمة المرور (٦ أحرف على الأقل)",
    currencyLabel: "عملة المتجر",
    loginBtn: "تسجيل الدخول",
    loggingIn: "جاري تسجيل الدخول...",
    registerBtn: "تسجيل المتجر",
    registering: "جاري إنشاء الحساب...",
    logoutBtn: "تسجيل الخروج",
    alreadyAccount: "لديك حساب تاجر بالفعل؟",
    noAccount: "ليس لديك حساب متجر بعد؟",
    loginHere: "سجل الدخول هنا",
    registerHere: "سجل متجرك هنا",

    // Dashboard & KPIs
    activeItems: "المنتجات النشطة",
    itemsListed: "عنصر معروض بالمتجر",
    totalInventory: "إجمالي المخزون",
    combinedStock: "مجموع الكميات المتاحة",
    catalogValue: "القيمة السوقية للمخزون",
    totalValueSubtext: "إجمالي قيمة المخزون الحالي",
    units: "قطعة",

    // Product Management
    addNewProduct: "إضافة منتج جديد",
    addSubtitle: "أنشئ منتجاً لإنشاء رابط طلب مباشر للمشتري",
    productTitleLabel: "اسم المنتج *",
    priceLabel: "السعر *",
    stockQtyLabel: "الكمية المتاحة *",
    descLabel: "الوصف",
    descPlaceholder: "اكتب وصف الخامة، المقاسات، أو طريقة الطلب عبر الواتساب/إنستغرام...",
    createListingBtn: "+ إضافة المنتج للمتجر",
    creatingListing: "جاري إضافة المنتج...",

    // Catalog & Search
    catalogTitle: "كتالوج المنتجات",
    catalogSubtitle: "إدارة الأسعار، الكميات المتاحة، وروبط البيع",
    searchPlaceholder: "البحث في المنتجات...",
    loadingCatalog: "جاري تحميل المنتجات...",
    noProducts: "لا توجد منتجات تطابق بحثك",
    noProductsSubtext: "أضف منتجات باستخدام النموذج لإعادة بناء كتالوج متجرك.",
    inStock: "متوفر بالكمية",
    outOfStock: "نفدت الكمية",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ التغييرات",
    cancel: "إلغاء",
    confirmDelete: "هل أنت تأكد من حذف هذا المنتج من متجرك؟",

    // Footers & Alerts
    rightsReserved: "جميع الحقوق محفوظة لمنصة التجار عبر التواصل الاجتماعي.",
  }
};

/**
 * Format currency clearly for USD and EGP without confusing trailing decimal zeros
 */
export function formatCurrency(amount, currency = 'EGP', lang = 'en') {
  const num = Number(amount) || 0;
  const isWhole = num % 1 === 0;

  // Use clean standard grouping; omit .00 if whole number so 999 is never confused with 999,000
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  
  if (currency === 'EGP') {
    if (lang === 'ar') {
      return `${formatted} ج.م`;
    }
    return `${formatted} EGP`;
  }

  // Default USD ($)
  if (lang === 'ar') {
    return `${formatted} $`;
  }
  return `$${formatted}`;
}

