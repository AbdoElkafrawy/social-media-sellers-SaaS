function NotFoundPage({ message, invalidId, onGoHome, lang = 'en' }) {
  const isAr = lang === 'ar';

  return (
    <div className="notfound-screen-shell">
      <div className="notfound-card shadow-lg">
        <div className="notfound-code">404</div>
        <h2 className="notfound-title">
          {isAr ? 'المتجر أو الصفحة غير موجودة' : 'Storefront Link Not Found'}
        </h2>
        <p className="notfound-subtitle">
          {message ||
            (isAr
              ? 'الرابط الذي تحاول الوصول إليه غير صحيح أو تم تغيير اسم المتجر من قِبل التاجر.'
              : 'The link you are trying to access is invalid, expired, or the seller has updated their storefront ID.')}
        </p>

        {invalidId && (
          <div className="notfound-meta-box">
            <span className="notfound-meta-label">
              {isAr ? 'معرف الرابط المستعلم عنه:' : 'Queried Store Identifier:'}
            </span>
            <code className="notfound-meta-code">{invalidId}</code>
          </div>
        )}

        <div className="notfound-tips-box">
          <h5>{isAr ? 'نصائح للوصول للمتجر:' : 'Helpful Tips:'}</h5>
          <ul>
            <li>
              {isAr
                ? 'تأكد من نسخ الرابط كاملاً من حساب التاجر على إنستغرام أو تيك توك.'
                : 'Ensure you copied the entire URL from the seller’s Instagram or TikTok bio.'}
            </li>
            <li>
              {isAr
                ? 'تواصل مع التاجر مباشرة للحصول على أحدث رابط لكتالوج المنتجات.'
                : 'Contact the seller directly on WhatsApp for an updated product catalog link.'}
            </li>
          </ul>
        </div>

        <div className="notfound-actions">
          <button
            type="button"
            className="btn-primary-action"
            onClick={onGoHome || (() => (window.location.href = '/'))}
          >
            {isAr ? 'العودة للمنصة الرئيسية' : 'Return to Platform Home'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
