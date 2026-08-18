import "dotenv/config";
import { searchApplications } from "../lib/queries";

const queries = ["घर बाटो","नागरिकता","नाग","citizenship","sifaris","nagarikta","जन्म","ghar banaune","naksa","व्यवसाय","business","recommendation","birth registration","charkila","बसोबास","gharbato","जन्म दर्ता","नक्सा"];

async function main() {
  for (const q of queries) {
    const { items, total } = await searchApplications({ q, perPage: 3 });
    console.log(`\n"${q}" → ${total}`);
    for (const i of items) console.log(`   ${i.score?.toFixed(2)}  ${i.title_ne}`);
  }
  process.exit(0);
}
main();
