[English](README.md)

# agi-ivrit

פרויקט שנועד להקל על תרגום משחקי AGI לעברית. מתחילים עם עותק חוקי של משחק AGI, מכינים אותו לתרגום, מתרגמים לעברית, ואז מקמפלים מחדש את המשחק המתורגם.

הפרויקט הזה מבוסס על הפרויקטים הבאים:

- [AGIHebrew של סגב משכרקי](https://github.com/SegMash/AGIHebrew)
- [צוות adventurebrew](https://github.com/adventurebrew/re-quest)

השינויים העיקריים מהפרויקטים האלה:

- סקריפטים ב-Typescript
- שימוש ב-agikit-slim לדיקומפילציה וקומפילציה דרך CLI
- ממשק React לצפייה ועריכה נוחה של קבצי התרגום

---

## אמ;לק

איך לתרגם משחק AGI:

> **הערה:** אם אתם ממשיכים עבודה על תרגום קיים, הריצו קודם `npm run fetch-translation <name>` (למשל, `npm run fetch-translation sq2`) ודלגו לשלב ה-release.

- התחילו עם כל קבצי ה-AGI המקוריים בתיקיית zip. אפשר להשתמש בקובץ `example.zip` שב-`example/` לניסויים
- העתיקו אותו ל-`project/`
- הריצו `npm run init-translations`
- הריצו `npm run extract-translations`
- הריצו `npm run review:dev`
- גשו ל-http://localhost:3000/agi-ivrit - תרגמו את כל המשפטים
- כשסיימתם לתרגם, ייצאו את כל ה-JSON באמצעות כפתורי ה-Export
- העתיקו אותם ל-`translations/[subdir]` כאשר subdir הוא שם התיקייה שלכם
- צרו קבצי pic, view ו-logic מותאמים באמצעות WinAGI או כלי אחר (ראו דוגמה ב-`translations/example`)
- העתיקו את הקבצים המותאמים לתת-תיקיות המתאימות ב-`translations/[subdir]`
- הריצו `npm run release:zip [subdir]`
- המשחק המתורגם הסופי זמין ב-`project/final/agi-build.zip`
- ליצירת קבצי patcher להפצה: שימו קודם את קבצי המשחק המקוריים ב-`project/orig/`, ואז הריצו `npm run release:patch [subdir]`
- הוסיפו אותו ל-ScummVM כמשחק fan-made ובדקו. וודאו שהשפה מוגדרת לעברית ושמופעל WORDS.TOK.EXTENDED

---

## סקירת תהליך התרגום

השלבים הבסיסיים בתרגום משחק AGI לעברית:

| שלב | תיאור |
|-----|-------|
| **1. הכנת המשחק** | דיקומפילציה של קבצי ה-AGI המקוריים והמרת כל מחרוזות ההודעות להפניות ממוספרות (למשל, `display(m1)` במקום `display("Hello, World")`) |
| **2. חילוץ טקסט** | חילוץ כל הטקסט באנגלית: (א) הודעות במשחק, (ב) פריטי מלאי, (ג) תיאורי view, (ד) אוצר מילים לפקודות |
| **3. תרגום** | תרגום כל הטקסט לעברית, כולל המחרוזות שחולצו וגם טקסט שמיוצג ויזואלית במשאבי PIC או VIEW |
| **4. שינויי משחק** | התאמת לוגיקת המשחק לתצוגה מימין-לשמאל והתאמות נוספות. למשל, פקודות display צריכות להיות מיושרות לימין, או views צריכים להיות מוצגים במיקומים שונים |
| **5. בנייה מחדש** | ייבוא המחרוזות המתורגמות, העתקת משאבי PIC ו-VIEW חדשים, החלת patches על קבצי logic, העתקת פונט עברי, יצירת קובץ WORDS.TOK.EXTENDED, וקומפילציה מחדש |
| **6. שחרור** | הכנת patch בינארי שמשתמשים עם עותק חוקי יכולים להחיל. הכנת patch ל-ScummVM לזיהוי המשחק כגרסה עברית |

---

## מטרות החבילה

שלבים 3 ו-4 הם הקשים ביותר - שם צריך באמת לתרגם טקסט ולפתח גרפיקה ולוגיקה מותאמים.

מטרת החבילה הזו היא לאוטמט, או לפחות לפשט, את כל השאר.

בפרט, החבילה נועדה:

- לאוטמט שלבים 1, 2 ו-5
- לספק כלים לפישוט שלבים 3, 4 ו-6
- לעשות את כל זה בצורה שלעולם לא גורמת לחומר מוגן בזכויות יוצרים להיכנס ל-version control

> **הערה:** החבילה לא מספקת כלים לעריכת גרפיקה בקבצי PIC ו-VIEW. WinAGI הוא כלי מצוין לכך.

---

## שימוש

### 1. הכנת המשחק

תחילה, תצטרכו קובץ zip שמכיל את כל הקבצים המקומפלים של משחק ה-AGI בשורש. זה יכול להיות, למשל, גרסה מכווצת של תיקיית משחק Sierra שרכשתם ב-GOG.

אם אין לכם כזה או שאתם רק מנסים, אפשר להשתמש במשחק הדוגמה שבריפו ב-`example/example.zip`

**להכנת המשחק:**

1. העתיקו את קובץ ה-zip ל-`project/`
2. הריצו `npm run init-translations`

זה ידקמפל את כל נכסי המשחק ויחליף מחרוזות הודעות בגרסאות ממוספרות.

> תיקיית `project/` כולה מתעלמת על ידי git אז שום דבר פה לא ייכנס ל-version control.

---

### 2. חילוץ טקסט

הריצו:

```bash
npm run extract-translations
```

זה יחלץ את כל המחרוזות הדורשות תרגום לארבעה קבצים בתיקיית `active-translation/`:

| קובץ | תוכן |
|------|------|
| `messages.json` | כל ההודעות במשחק |
| `objects.json` | שמות פריטי המלאי |
| `views.json` | תיאורי view |
| `vocabulary.json` | קבוצות מילים נרדפות לפקודות |

הקבצים פה הם קבצי העבודה שלכם. הם נכנסים ל-version control וכאן תעשו את עבודת התרגום.

---

### 3. תרגום טקסט

אפשר לערוך את קבצי המחרוזות ב-`active-translation/` ישירות עם עורך טקסט, או:

```bash
npm run review:dev
```

זה יפעיל שרת web עם ממשק ידידותי לכתיבת תרגומים, רישום הערות, וייצוא JSON מעודכנים (שתעתיקו חזרה ל-`active-translation/`).

> **טיפ:** אפשר להשתמש ב-`npm run review:build` לבניית גרסה שאפשר לפרסם, למשל כ-GitHub Page, לשיתוף עם מתרגמים אחרים.

---

### 4. שינוי המשחק

באמצעות WinAGI או כלי אחר, צרו את קבצי ה-PIC, VIEW ו-LOGIC המותאמים הדרושים למשחק המתורגם.

כשמוכנים, צרו תת-תיקייה למשחק בתיקיית `translations/`. אם מתכננים לשתף את התרגום, צרו אותו כריפו git נפרד (למשל, `agi-ivrit-sq2`) והגישו PR לריפו הזה להוספה ל-`translations.json` ולטבלת התרגומים הזמינים ב-README.

העתיקו את קבצי ה-`*.json` המוכנים מ-`active-translation/` לתת-תיקייה. צרו גם תת-תיקיות `view/`, `pic/` ו-`logic/` שמכילות:

| תיקייה | תוכן |
|--------|------|
| `view/` | קבצי view בפורמט `.agiview` (מדוקמפל) או `.agv` (WinAGI מקומפל). קבצי `.agiviewdesc` אופציונליים לתיאורים. שמות: `12.agiview`, `View12.agv` וכו' |
| `pic/` | קבצי תמונה בפורמט `.agipic` (מדוקמפל) או `.agp` (WinAGI מקומפל). שמות: `12.agipic`, `Pic12.agp`, `Picture12.agp` וכו' |
| `logic/` | קבצי patch (.patch) שיחולו על קבצי .agilogic |

קבצי WinAGI מקומפלים (`.agv`, `.agp`) עוברים דיקומפילציה אוטומטית בתהליך הבנייה.

---

### 5. בנייה מחדש

מספר פקודות בנייה זמינות:

| פקודה | מטרה |
|-------|------|
| `npm run release:dev <name>` | בנייה ל-`play-build/` לבדיקה ב-ScummVM |
| `npm run release:zip <name>` | בנייה ויצירת zip ב-`project/final/agi-build.zip` |
| `npm run release:patch <name>` | בנייה ויצירת קבצי patcher |
| `npm run release <name> <version>` | בנייה, יצירת patchers, ופרסום release ב-GitHub |

#### בניית פיתוח

```bash
npm run release:dev <translation-name>
```

זה מייבא תרגומים, בונה את המשחק, ומעתיק את הקבצים הסופיים ל-`play-build/` (שמתעלמת על ידי git). הפנו את ScummVM לתיקייה הזו לבדיקה מהירה.

#### בניית zip

```bash
npm run release:zip <translation-name>
```

זה עושה את אותו הדבר אבל יוצר קובץ zip ב-`project/final/agi-build.zip` במקום.

---

### 6. שחרור

להפצת התרגום, אפשר ליצור קבצי patcher חוצי-פלטפורמות שמשתמשים יכולים להריץ על קבצי המשחק שרכשו בחוקיות.

#### דרישות מקדימות

- שימו את קבצי המשחק המקוריים (לא מותאמים) ב-`project/orig/`
- לפרסום releases: התקינו את [GitHub CLI](https://cli.github.com/) והתחברו עם `gh auth login`

#### יצירת patchers (לבדיקה)

```bash
npm run release:patch <translation-name>
```

זה יוצר קבצי patcher לכל הפלטפורמות (Linux x64/arm64, macOS x64/arm64, Windows x64) ב-`project/patchers/`.

#### פרסום release

```bash
npm run release <translation-name> <version>
```

למשל: `npm run release sq1 v1.0.0`

זה בונה את ה-patchers ויוצר release ב-GitHub בריפו של התרגום (כפי שמוגדר ב-`translations.json`), ומעלה את כל קבצי ה-patcher כנכסים להורדה.

משתמשים יכולים אז להוריד את ה-patcher המתאים לפלטפורמה שלהם ולהריץ אותו על תיקיית המשחק המקורית כדי להחיל את התרגום לעברית

---

## תרגומים זמינים

תרגומים מתוחזקים בריפוזיטורים נפרדים. לשימוש:

1. שכפלו את הריפו והריצו `npm install`
2. הביאו את התרגום: `npm run fetch-translation <name>`
3. שימו את ה-zip של המשחק שרכשתם בחוקיות ב-`project/`
4. הריצו `npm run init-translations`
5. הריצו `npm run release <name>`

| משחק | ריפו | סטטוס |
|------|------|-------|
| Space Quest II | [agi-ivrit-sq2](https://github.com/sam-mfb/agi-ivrit-sq2) | בתהליך |

> **הערה:** תרגום ה-`example` כלול בריפו הזה למטרות הדגמה.

### פרסום אפליקציית Review

אם אתם מתחזקים ריפו תרגום, אפשר לפרסם אוטומטית את אפליקציית ה-review ל-GitHub Pages כדי שמשתפי פעולה יוכלו לצפות ולדון בתרגומים אונליין.

```bash
npm run install-review-workflow <name>
```

למשל: `npm run install-review-workflow sq2`

זה מתקין workflow של GitHub Actions בריפו התרגום. אחרי commit ו-push, לכו להגדרות הריפו ← Pages והגדירו את המקור ל-"GitHub Actions". אפליקציית ה-review תתעדכן אוטומטית בכל push.
