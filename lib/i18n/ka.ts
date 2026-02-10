/**
 * English translation dictionary
 * Flat key-value structure for simplicity — no i18n framework needed.
 */

const dictionary = {
  // ─── Common ─────────────────────────────────────────────────────────
  'common.appName': 'Agentic Tribe',
  'common.loading': 'Loading...',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.create': 'Create',
  'common.search': 'Search',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.previous': 'Previous',
  'common.close': 'Close',
  'common.confirm': 'Confirm',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.or': 'or',
  'common.all': 'All',

  // ─── Auth ───────────────────────────────────────────────────────────
  'auth.signIn': 'Sign In',
  'auth.signUp': 'Sign Up',
  'auth.signOut': 'Sign Out',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.currentPassword': 'Current Password',
  'auth.newPassword': 'New Password',
  'auth.confirmPassword': 'Confirm Password',
  'auth.signInTitle': 'Sign in to your account',
  'auth.signUpTitle': 'Create an account',
  'auth.noAccount': "Don't have an account?",
  'auth.hasAccount': 'Already have an account?',
  'auth.createAccount': 'Create Account',
  'auth.signInExisting': 'Sign in to existing account',
  'auth.invalidCredentials': 'Invalid email or password.',
  'auth.emailPlaceholder': 'Enter your email',
  'auth.passwordPlaceholder': 'Enter your password',
  'auth.rateLimited': 'Too many attempts. Please try again later.',

  // ─── Navigation ─────────────────────────────────────────────────────
  'nav.community': 'Community',
  'nav.classroom': 'Classroom',
  'nav.members': 'Members',
  'nav.leaderboard': 'Leaderboard',
  'nav.settings': 'Settings',
  'nav.admin': 'Admin',
  'nav.notifications': 'Notifications',
  'nav.profile': 'Profile',

  // ─── Landing Page ───────────────────────────────────────────────────
  'landing.join': 'Join',
  'landing.members': 'members',
  'landing.online': 'online',
  'landing.admin': 'Admin',
  'landing.aboutCommunity': 'About the Community',
  'landing.pricing': 'Pricing',
  'landing.free': 'Free',
  'landing.paid': 'Paid',
  'landing.perMonth': '/month',
  'landing.freePlanDesc': 'Browse community posts and comments',
  'landing.paidPlanDesc': 'Full access to all features',

  // ─── Free plan features ─────────────────────────────────────────────
  'pricing.free.viewPosts': 'View posts',
  'pricing.free.comment': 'Comments',
  'pricing.free.viewCourses': 'View course listings',
  'pricing.free.viewLeaderboard': 'View leaderboard',
  'pricing.free.memberDirectory': 'Member directory',

  // ─── Paid plan features ─────────────────────────────────────────────
  'pricing.paid.createPosts': 'Create posts',
  'pricing.paid.likePosts': 'Like posts and comments',
  'pricing.paid.accessCourses': 'Access all courses',
  'pricing.paid.leaderboard': 'Participate in leaderboard',
  'pricing.paid.allFreeFeatures': 'All free plan features',

  // ─── Settings ───────────────────────────────────────────────────────
  'settings.title': 'Settings',
  'settings.profile': 'Profile',
  'settings.account': 'Account',
  'settings.billing': 'Billing',
  'settings.general': 'General',
  'settings.security': 'Security',
  'settings.accountInfo': 'Account Information',
  'settings.name': 'Name',
  'settings.namePlaceholder': 'Enter your name',
  'settings.updatePassword': 'Update Password',
  'settings.deleteAccount': 'Delete Account',
  'settings.deleteWarning': 'Deleting your account is irreversible. Please proceed with caution.',
  'settings.passwordUpdated': 'Password updated successfully.',
  'settings.accountUpdated': 'Account updated successfully.',
  'settings.saving': 'Saving...',
  'settings.updating': 'Updating...',
  'settings.deleting': 'Deleting...',

  // ─── Settings - Profile ─────────────────────────────────────────────
  'settings.bio': 'Bio',
  'settings.bioPlaceholder': 'Tell us about yourself...',
  'settings.location': 'Location',
  'settings.locationPlaceholder': 'e.g. San Francisco, CA',
  'settings.websiteUrl': 'Website',
  'settings.facebookUrl': 'Facebook',
  'settings.linkedinUrl': 'LinkedIn',
  'settings.twitterUrl': 'Twitter/X',

  // ─── Settings - Billing ─────────────────────────────────────────────
  'billing.currentPlan': 'Current Plan',
  'billing.freePlan': 'Free',
  'billing.paidPlan': 'Paid',
  'billing.manage': 'Manage Subscription',
  'billing.upgrade': 'Subscribe',
  'billing.cancelAtEnd': 'Cancels at end of period',

  // ─── Community ──────────────────────────────────────────────────────
  'community.title': 'Community',
  'community.newPost': 'New Post',
  'community.allCategories': 'All Categories',
  'community.noPostsYet': 'No posts yet.',
  'community.pinnedPost': 'Pinned',

  // ─── Errors ─────────────────────────────────────────────────────────
  'error.generic': 'Something went wrong. Please try again.',
  'error.notFound': 'Page not found.',
  'error.notFoundDesc': 'The page you are looking for does not exist or has been removed.',
  'error.backHome': 'Back to Home',
  'error.unauthorized': 'Access denied.',
  'error.forbidden': 'You do not have permission to perform this action.',
  'error.passwordMismatch': 'New password and confirmation do not match.',
  'error.passwordSame': 'New password must be different from the current one.',
  'error.passwordIncorrect': 'Current password is incorrect.',
  'error.userCreateFailed': 'Failed to create account. Please try again.',
  'error.invalidInvitation': 'Invalid or expired invitation.',
  'error.somethingWentWrong': 'Something went wrong',
  'error.tryAgain': 'Try Again',
  'error.sectionLoadFailed': 'Failed to load this section.',
  'error.networkError': 'Network error. Please check your internet connection.',
  'error.serverError': 'Server error. Please try again later.',
  'error.sessionExpired': 'Session expired. Please sign in again.',

  // ─── Form Validation ──────────────────────────────────────────────
  'validation.required': 'This field is required.',
  'validation.emailInvalid': 'Invalid email format.',
  'validation.passwordMin': 'Password must be at least 8 characters.',
  'validation.passwordMax': 'Password must not exceed 100 characters.',
  'validation.nameRequired': 'Name is required.',
  'validation.nameMax': 'Name must not exceed 100 characters.',
  'validation.titleRequired': 'Title is required.',
  'validation.contentRequired': 'Content is required.',
  'validation.urlInvalid': 'Invalid URL format.',
  'validation.fileTooLarge': 'File is too large.',
  'validation.invalidFileType': 'File type is not allowed.',

  // ─── Upload ─────────────────────────────────────────────────────────
  'upload.avatar': 'Upload Avatar',
  'upload.changeAvatar': 'Change Avatar',
  'upload.uploading': 'Uploading...',
  'upload.invalidType': 'File type is not allowed.',
  'upload.tooLarge': 'File is too large. Maximum 5MB.',

  // ─── Admin ──────────────────────────────────────────────────────────
  'admin.title': 'Admin Panel',
  'admin.analytics': 'Analytics',
  'admin.memberManagement': 'Member Management',
  'admin.contentManagement': 'Content Management',
  'admin.communitySettings': 'Community Settings',
  'admin.categories': 'Categories',
  'admin.courses': 'Courses',

  // ─── Leaderboard ───────────────────────────────────────────────────
  'leaderboard.title': 'Leaderboard',
  'leaderboard.7days': '7 days',
  'leaderboard.30days': '30 days',
  'leaderboard.allTime': 'All time',
  'leaderboard.position': '#',
  'leaderboard.member': 'Member',
  'leaderboard.points': 'Points',
  'leaderboard.level': 'Level',
  'leaderboard.noData': 'No data yet.',

  // ─── Members ──────────────────────────────────────────────────────
  'members.title': 'Members',
  'members.searchPlaceholder': 'Search by name...',
  'members.filterByLevel': 'Filter by level',
  'members.allLevels': 'All levels',
  'members.noMembers': 'No members found.',
  'members.online': 'Online',
  'members.joined': 'Joined',
  'members.recentPosts': 'Recent Posts',
  'members.noPosts': 'No posts yet.',

  // ─── Profile ──────────────────────────────────────────────────────
  'profile.editProfile': 'Edit Profile',
  'profile.points': 'Points',
  'profile.level': 'Level',
  'profile.socialLinks': 'Social Links',
  'profile.profileUpdated': 'Profile updated successfully.',

  // ─── Paywall ──────────────────────────────────────────────────────
  'paywall.title': 'Join Agentic Tribe to read this post',
  'paywall.description': 'Sign up for free to unlock all community posts, courses, and more.',
  'paywall.joinNow': 'Join Now',
  'paywall.alreadyMember': 'Already a member?',
} as const;

export type TranslationKey = keyof typeof dictionary;

/**
 * Translate a key to English text.
 * Returns the key itself if not found (for debugging).
 */
export function t(key: TranslationKey): string {
  return dictionary[key] ?? key;
}

export default dictionary;
