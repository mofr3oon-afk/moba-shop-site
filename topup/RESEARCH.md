# مراجعة التكاملات — 17 أكتوبر 2026

هذا سجل بحث تقني، وليس تصريحًا من أي مزود ولا إثباتًا لدفع أو شحن فعلي.

## Midasbuy الرسمي

لم نعثر في المصادر الرسمية العامة التي راجعناها على API منشور ومصرح لنا به لاسترداد مخزون أكواد PUBG على IDs العملاء. غياب الوثائق العامة لا يثبت عدم وجود شراكة خاصة؛ نحتاج تصريحًا وبيانات Sandbox من المزود قبل بناء ذلك المسار.

شروط الاستخدام المنشورة تقصر الترخيص وتذكر قيودًا على الاستعمال التجاري وأدوات الروبوتات والجمع الآلي. لذلك لم نعتبر Playwright مسموحًا تلقائيًا، ولم نسجل الدخول أو نختبر استردادًا بالمتصفح أو نتجاوز CAPTCHA. يمكن إعادة تقييم جلسة **حساب اختبار منفصل فقط** عند توفير تصريح واضح، ثم يجب التوقف عند الحماية والتعامل مع Timeout كنتيجة مجهولة.

المصادر:

- [Midasbuy Terms of Service — بند 3](https://www.midasbuy.com/oversea_web/static/TermsofService.html)
- [Midasbuy Help Center](https://www.midasbuy.com/midasbuy/helpcenter)

## zlexdev/midasbuy-sdk

تمت مراجعة README وملفي العميل و`accounts.connect` من المصدر، دون تثبيت أو تشغيل المكتبة. هي Python SDK لخدمة مغلقة مستقلة؛ رابطها الافتراضي `free.midasbuy-api.dev` ليس دليلًا على أنها API رسمي من Midasbuy. مسار ربط الحساب يرسل البريد وكلمة المرور إلى خادم هذه الخدمة. هذا يخالف شرط عدم تسليم بيانات حسابك لخدمة غير موثقة بالنسبة لنا، فلم نستخدمه ولم نتواصل مع مشغلها.

الترخيص MIT يخص كود العميل، ولا يمنح إذنًا من Midasbuy ولا يثبت اعتمادية خادم الخدمة. يقدم المشروع نفسه كتجربة بخطة مجانية وحدود قابلة للتغيير، ويشير أيضًا إلى نطاقات مدفوعة. لم نشترِ مفتاحًا ولم نتحقق من استهلاك أو نجاح شحن حقيقي. وجود idempotency keys وانتظار حالة العملية مفيد تصميميًا، لكنه ليس برهانًا مستقلًا على عدم الاستهلاك بعد انقطاع أو على صحة نجاح الاسترداد.

- [README](https://github.com/zlexdev/midasbuy-sdk/blob/master/README.md)
- [العميل وعنوانه الافتراضي](https://github.com/zlexdev/midasbuy-sdk/blob/master/src/midasbuy_sdk/_async/_client.py)
- [ربط الحساب بالبيانات](https://github.com/zlexdev/midasbuy-sdk/blob/master/src/midasbuy_sdk/_async/resources/accounts.py)

النتيجة المنفذة: `SimulationRedeemer` يعمل محليًا، و`ManualReviewRedeemer` يتوقف للمراجعة بدون اتصال خارجي. واجهة الوحدة مستقلة وقابلة للاستبدال. نجاح Simulation ليس نجاح Midasbuy. الكود المجهول لا يعاد للمخزون أو المحاولة آليًا.

## Vodafone Cash والمحفظة الشخصية

صفحات فودافون الرسمية توثق خدمات المحفظة والدفع لدى التجار، لكنها لا توفر لنا في المصادر التي وجدناها عقد Webhook/API عامًا لتأكيد التحويلات الواردة لمحفظتك الشخصية. لم نفترض أن اسم مرسل SMS موثوق مصرفيًا.

حل Receipt Forwarder المنفذ يقبل حقولًا مصفاة وموقعة من جهازك للمطابقة والتنبيه فقط. لا يتعامل مع OTP/PIN أو رسائل شخصية ولا يرفع النص الخام. يتطلب هذا جهازًا متصلًا بالشريحة والإنترنت، ولا يغنيه السيرفر السحابي.

إذا أردت تأكيدًا آليًا موثوقًا، يلزم حساب تاجر/مزود معتمد وتكامل دفع مناسب، وليس مجرد قراءة رسائل المحفظة. توثق Paymob مثلًا قبول Vodafone Cash ضمن محافظ الدفع، لكن ذلك لا يثبت إمكانية قراءة تحويلات محفظة شخصية قائمة أو الاستغناء عن فتح حساب تاجر. لم ننفذ API تجاريًا بمفاتيح مختلقة، ولم نشترك أو ندفع رسومًا. عند توفير الحساب يلزم التحقق من webhook الموقع والاستعلام من جهة المزود والمبلغ والعملة ومعرّف الطلب قبل تسليم حقيقي.

- [Vodafone Cash](https://web.vodafone.com.eg/en/vodafone-cash)
- [Vodafone merchant payments](https://web.vodafone.com.eg/en/cashmerchantpayments1)
- [Paymob payment methods — Mobile Wallets](https://developers.paymob.com/paymob-docs/developers/quicklink-apis/overview)

## الاستضافة المختارة

Vercel مناسب للموقع والـWebhook الحالي، لكن ملفاته المؤقتة لا تصلح كمخزون SQLite دائم، وتنفيذ الوظائف محدود المدة. اخترنا خدمة Railway منفصلة بخدمة واحدة وقرص دائم للـWorker وSQLite، مع الحفاظ على Supabase الموجود للموقع. يدعم التخطيط ترحيل خدمة الشحن إلى PostgreSQL لاحقًا عند الحاجة لتوسعة متعددة النسخ.

Railway يدعم أقراصًا ونسخها الاحتياطية، لكنه يقيد تعدد replicas مع volume، ويذكر انقطاعًا قصيرًا أثناء إعادة النشر. التشغيل ليس ضمان توافر مطلق ولا وعدًا باستضافة مجانية. لم ننشر أو نغير إعدادات أي حساب.

- [Vercel filesystem/runtime](https://vercel.com/docs/functions/runtimes)
- [Vercel execution duration](https://vercel.com/docs/functions/configuring-functions/duration)
- [Railway volumes caveats](https://docs.railway.com/volumes/reference)
- [Railway backups](https://docs.railway.com/volumes/backups)
- [Railway plans](https://docs.railway.com/pricing/plans)
