# Gennetex бүртгэл

Google Sheet-ийг үндсэн өгөгдлийн сан болгон ашигладаг зурагтай бүртгэлийн Next.js систем.

## Боломжууд

- `/` — овог, нэр, имэйл, утас, хаяг, эрх, нүүр зурагтай бүртгэл
- `/a` — бүртгэлтэй бүх хүнийг зурагтай нь харах, хайх
- Шинэ бүртгэлийг 10 секунд тутам илрүүлэх browser notification
- Telegram болон имэйлээр шинэ бүртгэлийн мэдэгдэл илгээх боломж
- Зургийг 320×320 WebP болгон шахаж Google Sheet-ийн `Зураг` баганад хадгална
- Тусдаа database болон image storage шаардлагагүй

Ашиглаж буй хүснэгт: [Google Sheet](https://docs.google.com/spreadsheets/d/14h3HO7EsdrF-zYfiV2kxPEaHEMshRwnI7IgirIV3RZA/edit)

## Local ажиллуулах

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Дараа нь `http://localhost:3000` болон `http://localhost:3000/a` хаягийг нээнэ.

## Google Sheet бичих эрх тохируулах

1. [Google Cloud Console](https://console.cloud.google.com/) дээр project үүсгэн **Google Sheets API**-г идэвхжүүлнэ.
2. **IAM & Admin → Service Accounts** хэсэгт service account үүсгэн JSON key татна.
3. Google Sheet-ийн **Share** товчоор service account-ийн `client_email`-д **Editor** эрх өгнө.
4. `.env.local` файлд дараах утгуудыг оруулна:

```env
GOOGLE_SHEET_ID=14h3HO7EsdrF-zYfiV2kxPEaHEMshRwnI7IgirIV3RZA
GOOGLE_SERVICE_ACCOUNT_EMAIL=...iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Эсвэл JSON key-г бүхлээр нь нэг мөрөнд `GOOGLE_SERVICE_ACCOUNT_JSON` хувьсагчид өгч болно.

Анхны амжилттай бүртгэл дээр одоогийн `Овог, Нэр, Gmail, Утасны дугаар, Хаяг, Эрх` багануудын араас `Зураг, Бүртгүүлсэн огноо, ID` багана автоматаар нэмэгдэнэ.

## Мэдэгдэл

### Telegram

BotFather-аас bot token аваад bot-оо хүссэн group/chat-д нэмнэ.

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### Имэйл (Resend)

```env
RESEND_API_KEY=re_...
NOTIFICATION_EMAIL=admin@example.com
RESEND_FROM_EMAIL=Burtgel <burtgel@your-domain.mn>
```

Telegram болон Resend-ийг хоёуланг эсвэл аль нэгийг тохируулж болно. Мэдэгдэл амжилтгүй болсон ч Sheet дэх бүртгэл устахгүй.

## Vercel deploy ба domain

1. GitHub repository-г Vercel project болгон import хийнэ.
2. Дээрх environment variables-ийг Vercel-ийн **Settings → Environment Variables** хэсэгт нэмнэ.
3. Deploy хийсний дараа Vercel-ийн **Domains** хэсэгт өөрийн domain-ийг холбоно.
4. Domain холбогдсоны дараа `https://your-domain.mn/a` нь бүртгэлтэй хүмүүсийн жагсаалт болно.

> `/a` нь хүсэлтийн дагуу нээлттэй хуудас. Sheet-д имэйл, утас, хаяг зэрэг хувийн мэдээлэл байгаа тул нийтийн domain ашиглах бол access protection нэмэхийг зөвлөж байна.

## Шалгалт

```bash
npm run typecheck
npm run lint
npm run build
```
