/**
 * Georgian (ქართული) translation dictionary
 * Flat key-value structure for simplicity — no i18n framework needed.
 */

const dictionary = {
  // ─── Common ─────────────────────────────────────────────────────────
  'common.appName': 'AI წრე',
  'common.loading': 'იტვირთება...',
  'common.save': 'შენახვა',
  'common.cancel': 'გაუქმება',
  'common.delete': 'წაშლა',
  'common.edit': 'რედაქტირება',
  'common.create': 'შექმნა',
  'common.search': 'ძიება',
  'common.back': 'უკან',
  'common.next': 'შემდეგი',
  'common.previous': 'წინა',
  'common.close': 'დახურვა',
  'common.confirm': 'დადასტურება',
  'common.yes': 'დიახ',
  'common.no': 'არა',
  'common.or': 'ან',
  'common.all': 'ყველა',

  // ─── Auth ───────────────────────────────────────────────────────────
  'auth.signIn': 'შესვლა',
  'auth.signUp': 'რეგისტრაცია',
  'auth.signOut': 'გასვლა',
  'auth.email': 'ელფოსტა',
  'auth.password': 'პაროლი',
  'auth.currentPassword': 'მიმდინარე პაროლი',
  'auth.newPassword': 'ახალი პაროლი',
  'auth.confirmPassword': 'დაადასტურეთ პაროლი',
  'auth.signInTitle': 'შედით თქვენს ანგარიშზე',
  'auth.signUpTitle': 'შექმენით ანგარიში',
  'auth.noAccount': 'არ გაქვთ ანგარიში?',
  'auth.hasAccount': 'უკვე გაქვთ ანგარიში?',
  'auth.createAccount': 'ანგარიშის შექმნა',
  'auth.signInExisting': 'არსებულ ანგარიშზე შესვლა',
  'auth.invalidCredentials': 'არასწორი ელფოსტა ან პაროლი.',
  'auth.emailPlaceholder': 'შეიყვანეთ ელფოსტა',
  'auth.passwordPlaceholder': 'შეიყვანეთ პაროლი',
  'auth.rateLimited': 'ბევრი მცდელობა. სცადეთ მოგვიანებით.',

  // ─── Navigation ─────────────────────────────────────────────────────
  'nav.community': 'თემი',
  'nav.classroom': 'კლასრუმი',
  'nav.members': 'წევრები',
  'nav.leaderboard': 'ლიდერბორდი',
  'nav.settings': 'პარამეტრები',
  'nav.admin': 'ადმინი',
  'nav.notifications': 'შეტყობინებები',
  'nav.profile': 'პროფილი',

  // ─── Landing Page ───────────────────────────────────────────────────
  'landing.join': 'გაწევრიანება',
  'landing.members': 'წევრი',
  'landing.online': 'ონლაინ',
  'landing.admin': 'ადმინი',
  'landing.aboutCommunity': 'საზოგადოების შესახებ',
  'landing.pricing': 'ფასები',
  'landing.free': 'უფასო',
  'landing.paid': 'ფასიანი',
  'landing.perMonth': '/თვე',
  'landing.freePlanDesc': 'იხილეთ თემის პოსტები და კომენტარები',
  'landing.paidPlanDesc': 'სრული წვდომა ყველა ფუნქციაზე',

  // ─── Free plan features ─────────────────────────────────────────────
  'pricing.free.viewPosts': 'პოსტების ნახვა',
  'pricing.free.comment': 'კომენტარები',
  'pricing.free.viewCourses': 'კურსების სიის ნახვა',
  'pricing.free.viewLeaderboard': 'ლიდერბორდის ნახვა',
  'pricing.free.memberDirectory': 'წევრების დირექტორია',

  // ─── Paid plan features ─────────────────────────────────────────────
  'pricing.paid.createPosts': 'პოსტების შექმნა',
  'pricing.paid.likePosts': 'პოსტებისა და კომენტარების მოწონება',
  'pricing.paid.accessCourses': 'ყველა კურსზე წვდომა',
  'pricing.paid.leaderboard': 'ლიდერბორდში მონაწილეობა',
  'pricing.paid.allFreeFeatures': 'უფასო გეგმის ყველა ფუნქცია',

  // ─── Settings ───────────────────────────────────────────────────────
  'settings.title': 'პარამეტრები',
  'settings.profile': 'პროფილი',
  'settings.account': 'ანგარიში',
  'settings.billing': 'ბილინგი',
  'settings.general': 'ზოგადი',
  'settings.security': 'უსაფრთხოება',
  'settings.accountInfo': 'ანგარიშის ინფორმაცია',
  'settings.name': 'სახელი',
  'settings.namePlaceholder': 'შეიყვანეთ სახელი',
  'settings.updatePassword': 'პაროლის განახლება',
  'settings.deleteAccount': 'ანგარიშის წაშლა',
  'settings.deleteWarning': 'ანგარიშის წაშლა შეუქცევადია. გთხოვთ, ფრთხილად იმოქმედოთ.',
  'settings.passwordUpdated': 'პაროლი წარმატებით განახლდა.',
  'settings.accountUpdated': 'ანგარიში წარმატებით განახლდა.',
  'settings.saving': 'ინახება...',
  'settings.updating': 'ახლდება...',
  'settings.deleting': 'იშლება...',

  // ─── Settings - Profile ─────────────────────────────────────────────
  'settings.bio': 'ბიო',
  'settings.bioPlaceholder': 'მოგვიყევით თქვენ შესახებ...',
  'settings.location': 'მდებარეობა',
  'settings.locationPlaceholder': 'მაგ: თბილისი, საქართველო',
  'settings.websiteUrl': 'ვებსაიტი',
  'settings.facebookUrl': 'Facebook',
  'settings.linkedinUrl': 'LinkedIn',
  'settings.twitterUrl': 'Twitter/X',

  // ─── Settings - Billing ─────────────────────────────────────────────
  'billing.currentPlan': 'მიმდინარე გეგმა',
  'billing.freePlan': 'უფასო',
  'billing.paidPlan': 'ფასიანი',
  'billing.manage': 'გამოწერის მართვა',
  'billing.upgrade': 'გამოწერა',
  'billing.cancelAtEnd': 'გაუქმდება პერიოდის ბოლოს',

  // ─── Community ──────────────────────────────────────────────────────
  'community.title': 'თემი',
  'community.newPost': 'ახალი პოსტი',
  'community.allCategories': 'ყველა კატეგორია',
  'community.noPostsYet': 'ჯერ პოსტები არ არის.',
  'community.pinnedPost': 'მიმაგრებული',

  // ─── Errors ─────────────────────────────────────────────────────────
  'error.generic': 'რაღაც არასწორად წავიდა. სცადეთ თავიდან.',
  'error.notFound': 'გვერდი ვერ მოიძებნა.',
  'error.unauthorized': 'წვდომა აკრძალულია.',
  'error.forbidden': 'არ გაქვთ ამ მოქმედების უფლება.',
  'error.passwordMismatch': 'ახალი პაროლი და დადასტურება არ ემთხვევა.',
  'error.passwordSame': 'ახალი პაროლი უნდა განსხვავდებოდეს მიმდინარეისგან.',
  'error.passwordIncorrect': 'მიმდინარე პაროლი არასწორია.',
  'error.userCreateFailed': 'მომხმარებლის შექმნა ვერ მოხერხდა. სცადეთ თავიდან.',
  'error.invalidInvitation': 'არასწორი ან ვადაგასული მოსაწვევი.',

  // ─── Upload ─────────────────────────────────────────────────────────
  'upload.avatar': 'ავატარის ატვირთვა',
  'upload.changeAvatar': 'ავატარის შეცვლა',
  'upload.uploading': 'იტვირთება...',
  'upload.invalidType': 'ფაილის ტიპი დაუშვებელია.',
  'upload.tooLarge': 'ფაილი ძალიან დიდია. მაქსიმუმ 5MB.',

  // ─── Admin ──────────────────────────────────────────────────────────
  'admin.title': 'ადმინ პანელი',
  'admin.analytics': 'ანალიტიკა',
  'admin.memberManagement': 'წევრების მართვა',
  'admin.contentManagement': 'კონტენტის მართვა',
  'admin.communitySettings': 'თემის პარამეტრები',
  'admin.categories': 'კატეგორიები',
  'admin.courses': 'კურსები',
} as const;

export type TranslationKey = keyof typeof dictionary;

/**
 * Translate a key to Georgian text.
 * Returns the key itself if not found (for debugging).
 */
export function t(key: TranslationKey): string {
  return dictionary[key] ?? key;
}

export default dictionary;
