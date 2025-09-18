const express = require("express");
const path = require("path");
const admin = require("firebase-admin");

// ✅ Парсинг JSON ключа из переменной окружения
let credential;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    credential = admin.credential.cert(serviceAccount);
  } catch (err) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON содержит невалидный JSON:", err);
    process.exit(1);
  }
} else {
  console.error("❌ Переменная окружения FIREBASE_SERVICE_ACCOUNT_JSON не установлена");
  process.exit(1);
}

admin.initializeApp({ credential });

const db = admin.firestore()

const app = express()
const PORT = 3003

// Middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))

  // Главная страница (страница выхода)
  app.get("/", (_, res) => {
    res.sendFile(path.join(__dirname, "views/index.html"))
  })// Обработка выхода волонтера
app.post("/leave", async (req, res) => {
  const { name, surname } = req.body

  try {
    // Поиск волонтера в базе
    const volunteersRef = db.collection("volunteers")
    const snapshot = await volunteersRef
      .where("name", "==", name)
      .where("surname", "==", surname)
      .where("status", "==", "new")
      .get()

    if (snapshot.empty) {
      return res.status(404).send("Волонтер не найден или уже завершил смену")
    }

    // Обновляем запись волонтера
    const volunteerDoc = snapshot.docs[0]
    const leaveTime = admin.firestore.FieldValue.serverTimestamp()
    
    await volunteerDoc.ref.update({
      comeOut: leaveTime,
      status: "completed"
    })

    console.log(`✅ Волонтер завершил смену: ${name} ${surname}`)

    // Перенаправление на goodbye.html с параметрами
    const params = new URLSearchParams({
      name: name,
      surname: surname,
      leaveTime: new Date().toISOString()
    })
    res.redirect(`/goodbye?${params.toString()}`)
  } catch (err) {
    console.error("❌ Ошибка при обработке выхода:", err)
    res.status(500).send("Ошибка при обработке выхода")
  }
})

// Страница прощания
app.get("/goodbye", (req, res) => {
  res.sendFile(path.join(__dirname, "views/goodbye.html"))
})

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер работает: http://localhost:${PORT}`)
})

// Главная страница (страница выхода)
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "views/leave.html"))
})

// Обработка выхода волонтера
app.post("/leave", async (req, res) => {
  const { name, surname } = req.body

  try {
    // Поиск волонтера в базе
    const volunteersRef = db.collection("volunteers")
    const snapshot = await volunteersRef
      .where("name", "==", name)
      .where("surname", "==", surname)
      .where("status", "==", "active")
      .get()

    if (snapshot.empty) {
      return res.status(404).send("Волонтер не найден или уже завершил смену")
    }

    // Обновляем запись волонтера
    const volunteerDoc = snapshot.docs[0]
    const leaveTime = admin.firestore.FieldValue.serverTimestamp()
    
    await volunteerDoc.ref.update({
      comeOut: leaveTime,
      status: "completed"
    })

    console.log(`✅ Волонтер завершил смену: ${name} ${surname}`)

    // Перенаправление на goodbye.html с параметрами
    const params = new URLSearchParams({
      name: name,
      surname: surname,
      leaveTime: new Date().toISOString()
    })
    res.redirect(`/goodbye?${params.toString()}`)
  } catch (err) {
    console.error("❌ Ошибка при обработке выхода:", err)
    res.status(500).send("Ошибка при обработке выхода")
  }
})

// Страница прощания
app.get("/goodbye", (req, res) => {
  res.sendFile(path.join(__dirname, "views/goodbye.html"))
})

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер работает: http://localhost:${PORT}`)
})
