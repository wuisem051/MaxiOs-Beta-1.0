import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
const Footer = () => {
  const [footerText, setFooterText] = useState('');

  useEffect(() => {
    const fetchFooterText = async () => {
      try {
        const q = query(collection(db, 'settings'), where('key', '==', 'siteConfig'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const record = querySnapshot.docs[0].data();
          setFooterText(record.footerText || `© ${new Date().getFullYear()} BitcoinPool. Todos los derechos reservados. Versión del proyecto 1.0 Beta`);
        } else {
          setFooterText(`© ${new Date().getFullYear()} BitcoinPool. Todos los derechos reservados. Versión del proyecto 1.0 Beta`);
        }
      } catch (err) {
        console.error("Error fetching footer text from Firebase:", err);
        setFooterText(`© ${new Date().getFullYear()} BitcoinPool. Todos los derechos reservados. Versión del proyecto 1.0 Beta`); // Fallback en caso de error
      }
    };
    fetchFooterText();
  }, []);

  return (
    <footer className="bg-light_card border-t border-gray_border">
      <div className="container mx-auto py-6 px-4 text-center text-gray_text">
        <p>{footerText}</p>
      </div>
    </footer>
  );
};

export default Footer;
