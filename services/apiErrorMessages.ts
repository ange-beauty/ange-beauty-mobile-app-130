export type ApiErrorPayload = {
  errorCode?: string;
  error_code?: string;
  message?: string | { errorCode?: string; error_code?: string };
};

export const arabicApiErrorMessages: Record<string, string> = {
  InvalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  AuthenticationRequired: "يرجى تسجيل الدخول للمتابعة.",
  Unauthorized: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  NoPermissonNoResourceAccess: "ليس لديك صلاحية للوصول إلى هذا المورد.",
  MissingParam: "يرجى إكمال الحقول المطلوبة.",
  InvalidParamValue: "إحدى القيم المدخلة غير صحيحة.",
  SecurityTokenValidationFailed: "تعذر التحقق الأمني. يرجى إعادة المحاولة.",
  MustUpdateApp: "يجب تحديث التطبيق للمتابعة.",
  BadRequest: "الطلب غير صالح. يرجى مراجعة البيانات المدخلة.",
  ValidationFailed: "تعذر التحقق من البيانات المدخلة.",
  ResourceNotFound: "المورد المطلوب غير موجود.",
  MethodNotAllowed: "هذه العملية غير مسموحة.",
  Conflict: "تتعارض العملية مع الحالة الحالية.",
  ConcurrencyConflictError: "تم تعديل البيانات من مستخدم آخر. حدّث الصفحة وحاول مجدداً.",
  InternalServerError: "حدث خطأ في الخادم. يرجى المحاولة لاحقاً.",
  GeneralError: "حدث خطأ غير متوقع. يرجى المحاولة مجدداً.",
  DatabaseError: "تعذر إكمال العملية حالياً.",
  ProductDoesNotExisteOrNoCodebar: "المنتج غير موجود أو أن الباركود غير صحيح.",
  ProductDoesNotExistOrNoCodebar: "المنتج غير موجود أو أن الباركود غير صحيح.",
  ProductDoesNotExisteOrNoId: "المنتج غير موجود.",
  ProductNotFound: "المنتج غير موجود.",
  NoBrandFound: "البراند غير موجود.",
  CategoryNotFound: "التصنيف غير موجود.",
  SellingPointDoesNotExisteOrNoid: "نقطة البيع غير موجودة.",
  NoSellingPointId: "نقطة البيع مطلوبة.",
  outOfStock: "بعض المنتجات غير متوفرة بالكمية المطلوبة.",
  NotEnoughtQuantiy: "الكمية المطلوبة أكبر من المخزون المتوفر.",
  userTelephoneAlreadyExists: "رقم الهاتف مرتبط بحساب آخر.",
  userEmailAlreadyExists: "البريد الإلكتروني مرتبط بحساب آخر.",
  InvalidNotificationToken: "رمز الإشعارات غير صالح.",
  AccountOwnerDoesNotExist: "صاحب الحساب غير موجود.",
  AccountOwnerNotAllowed: "لا يمكن إنشاء حساب مالي لهذا المستخدم.",
  AccountTypeDoesNotExist: "نوع الحساب غير موجود.",
  AccountAlreadyExists: "الحساب موجود مسبقاً.",
  InvalidAccountOrAccountDoesNotExist: "الحساب المالي غير صالح أو غير موجود.",
  InvalidOperationType: "نوع العملية غير صالح.",
  CurrencyCodeAlreadyExists: "العملة موجودة مسبقاً.",
  InvalidBuildInformation: "معلومات إصدار التطبيق غير مكتملة.",
  InvalidBuildNumberFormat: "رقم بناء التطبيق غير صالح.",
  InvalidVersionFormat: "رقم إصدار التطبيق غير صالح.",
  UnkownError: "حدث خطأ غير متوقع. يرجى المحاولة مجدداً.",
};

export function getApiErrorCode(payload: ApiErrorPayload | null | undefined): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  if (typeof payload.errorCode === "string") return payload.errorCode;
  if (typeof payload.error_code === "string") return payload.error_code;
  if (payload.message && typeof payload.message === "object") {
    return payload.message.errorCode || payload.message.error_code;
  }
  return undefined;
}

export function getArabicApiErrorMessage(
  payload: ApiErrorPayload | null | undefined,
  fallback = "حدث خطأ. يرجى المحاولة مجدداً.",
): string {
  const code = getApiErrorCode(payload);
  return (code && arabicApiErrorMessages[code]) || fallback;
}

