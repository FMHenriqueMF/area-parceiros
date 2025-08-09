// populate-db.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Lembre-se de colocar o caminho certo

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const servicosParaUpload = [
  {
    categoria: "Sofá",
    item: "Sofá de até 1,80m",
    valor_grande: 264.60,
    valor_desconto: 149.00,
  },
  {
    categoria: "Sofá",
    item: "Sofá de até 2,30m",
    valor_grande: 292.60,
    valor_desconto: 169.00,
  },
  {
    categoria: "Sofá",
    item: "Sofá de até 2,65m",
    valor_grande: 320.60,
    valor_desconto: 189.00,
  },
  {
    categoria: "Sofá",
    item: "Sofá de até 3,00m",
    valor_grande: 348.60,
    valor_desconto: 209.00,
  },
  {
    categoria: "Sofá",
    item: "Sofá de até 3,30m",
    valor_grande: 376.60,
    valor_desconto: 229.00,
  },
  {
    categoria: "Sofá",
    item: "Sofá de até 3,65m",
    valor_grande: 404.60,
    valor_desconto: 249.00,
  },
  {
    categoria: "Sofá",
    item: "Sofá de até 4,00m",
    valor_grande: 432.60,
    valor_desconto: 269.00,
  },
  {
    categoria: "Sofá",
    item: "Sofá de até 4,30m",
    valor_grande: 460.60,
    valor_desconto: 289.00,
  },
  {
    categoria: "Sofá",
    item: "Sofá de até 4,65m",
    valor_grande: 488.60,
    valor_desconto: 309.00,
  },
  {
    categoria: "Sofá",
    item: "Sofá de até 5,00m",
    valor_grande: 516.60,
    valor_desconto: 329.00,
  },
  {
    categoria: "Sofá",
    item: "Sofá de até 5,30m",
    valor_grande: 544.60,
    valor_desconto: 349.00,
  },
  {
    categoria: "Sofá",
    item: "Sofá de até 5,65m",
    valor_grande: 572.60,
    valor_desconto: 369.00,
  },
  {
    categoria: "Sofá",
    item: "Sofá de até 6,00m",
    valor_grande: 600.60,
    valor_desconto: 389.00,
  },
  {
    categoria: "Colchão",
    item: "Colchão Solteiro",
    valor_grande: 180.00,
    valor_desconto: 129.00,
  },
  {
    categoria: "Colchão",
    item: "Colchão Casal",
    valor_grande: 208.00,
    valor_desconto: 149.00,
  },
  {
    categoria: "Colchão",
    item: "Colchão Queen",
    valor_grande: 236.00,
    valor_desconto: 169.00,
  },
  {
    categoria: "Colchão",
    item: "Colchão King",
    valor_grande: 264.00,
    valor_desconto: 189.00,
  },
];

exports.uploadServicos = async () => {
  const batch = db.batch();
  servicosParaUpload.forEach((servico) => {
    const docRef = db.collection('orcamento').doc();
    batch.set(docRef, servico);
  });

  await batch.commit();
};