const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAKCRPxkWANrydb-WDAzJ-1-38VSiXFM3Q",
  authDomain: "kilometers-driven.firebaseapp.com",
  projectId: "kilometers-driven",
  storageBucket: "kilometers-driven.firebasestorage.app",
  messagingSenderId: "829528057571",
  appId: "1:829528057571:web:ae1e5d1c8ed39cd92a07d6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, 'admin@teste.com', 'Senha@123');
    
    await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
      uid: userCredential.user.uid,
      perfil: 'admin'
    });
    
    console.log('Admin criado! Email: admin@teste.com | Senha: Senha@123');
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

createAdmin();