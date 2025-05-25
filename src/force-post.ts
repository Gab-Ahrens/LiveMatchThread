/**
 * Direct Reddit Posting Script
 *
 * This script bypasses all normal flow and directly posts to Reddit with detailed error reporting
 */
import snoowrap from "snoowrap";
import {
  REDDIT_USER_AGENT,
  REDDIT_CLIENT_ID,
  REDDIT_CLIENT_SECRET,
  REDDIT_USERNAME,
  REDDIT_PASSWORD,
  REDDIT_SUBREDDIT,
} from "./config/appConfig";

const title = "[JOGO] | BRASILEIRÃO | CORINTHIANS X INTERNACIONAL | 7ª RODADA";
const body = `
## 🏆 BRASILEIRÃO - RODADA 7

**Corinthians** vs **Internacional**

📍 *Neo Química Arena, São Paulo, São Paulo*  
🕓 *Horário: sábado, 3 de maio de 2025 às 18:30 (Brasília)*  
🧑‍⚖️ Árbitro: Desconhecido

---

👥 **Escalações**

**Corinthians**
👔 Técnico: Dorival Júnior
🔴 Titulares: Hugo Souza, Matheuzinho, André Ramalho, Cacá, Hugo, Raniele, José Martínez, André Carrillo, Ángel Romero, Memphis Depay, Yuri Alberto
⚪ Banco: Matheus Donelli, Félix Torres, João Pedro Tchoca, Matheus Bidu, Léo Mana, Maycon, Alex Santana, Igor Coronado, Breno Bidon, Charles, Héctor Hernández, Talles Magno

**Internacional**
👔 Técnico: Roger Machado
🔴 Titulares: Anthoni, Braian Aguirre, Vitão, Victor Gabriel, Alexandro Bernabei, Fernando, Thiago Maia, Wesley Ribeiro, Bruno Henrique, Alan Patrick, Enner Valencia
⚪ Banco: Kauan, Ramon, Juninho, Agustín Rogel, Nathan, Bruno Tabata, Óscar Romero, Gabriel Carvalho, Gustavo Prado, Ronaldo, Luis Otávio, Raykkonen Pereira Soares

---

📉 Últimos 5 jogos do Corinthians (BRASILEIRÃO)
❌ Derrota contra Flamengo (0x4)
✅ Vitória contra Sport Recife (2x1)
❌ Derrota contra Fluminense (0x2)
❌ Derrota contra Palmeiras (0x2)
✅ Vitória contra Vasco DA Gama (3x0)

📉 Últimos 5 jogos do Internacional (BRASILEIRÃO)
✅ Vitória contra Juventude (3x1)
➖ Empate contra Gremio (1x1)
❌ Derrota contra Palmeiras (0x1)
➖ Empate contra Fortaleza EC (0x0)
✅ Vitória contra Cruzeiro (3x0)

⚽️ Vamo Inter! ❤️

---
^(*Esse thread foi criado automaticamente por um bot. Match Thread de EMERGÊNCIA*)
`;

async function postToReddit() {
  console.log("🚨 DIRECT EMERGENCY POSTING");
  console.log(`Subreddit: ${REDDIT_SUBREDDIT}`);
  console.log(`Title length: ${title.length} characters`);
  console.log(`Body length: ${body.length} characters`);

  try {
    // Verify that we have credentials
    if (
      !REDDIT_CLIENT_ID ||
      !REDDIT_CLIENT_SECRET ||
      !REDDIT_USERNAME ||
      !REDDIT_PASSWORD
    ) {
      console.error("❌ ERROR: Missing Reddit credentials");
      const missing = [];
      if (!REDDIT_CLIENT_ID) missing.push("REDDIT_CLIENT_ID");
      if (!REDDIT_CLIENT_SECRET) missing.push("REDDIT_CLIENT_SECRET");
      if (!REDDIT_USERNAME) missing.push("REDDIT_USERNAME");
      if (!REDDIT_PASSWORD) missing.push("REDDIT_PASSWORD");
      console.error(`Missing: ${missing.join(", ")}`);
      return;
    }

    console.log("Creating Reddit client...");
    const reddit = new snoowrap({
      userAgent: REDDIT_USER_AGENT,
      clientId: REDDIT_CLIENT_ID,
      clientSecret: REDDIT_CLIENT_SECRET,
      username: REDDIT_USERNAME,
      password: REDDIT_PASSWORD,
    });

    console.log("Checking credentials...");
    try {
      const me = await reddit.getMe();
      console.log(`✅ Authenticated as: ${me.name}`);
    } catch (authError) {
      console.error("❌ Authentication error:", authError);
      return;
    }

    console.log(`📝 Posting to r/${REDDIT_SUBREDDIT}...`);
    try {
      const submission = await reddit
        .getSubreddit(REDDIT_SUBREDDIT)
        .submitSelfpost({
          title: title,
          text: body,
          sendReplies: true,
          subredditName: REDDIT_SUBREDDIT,
        });

      console.log(`✅ SUCCESS! Posted at: ${submission.url}`);
      console.log(`Post ID: ${submission.id}`);
      console.log(`Title: ${submission.title}`);
    } catch (postError) {
      console.error("❌ Error posting:", postError);
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
  }
}

// Run it
postToReddit().catch((err) => {
  console.error("Uncaught error:", err);
});
