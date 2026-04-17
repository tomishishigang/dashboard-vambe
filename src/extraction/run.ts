import "dotenv/config";
import { parseLeadsCSV } from "./csv-parser";
import { extractLead, hashTranscript, withRetry } from "./extract";
import { createProvider } from "./providers";
import { resolveProviderConfig } from "./providers/config";
import { LeadRepository } from "../db/client";
import { DB_PATH, CSV_PATH } from "../config/paths";

function parseSampleArg(): number | undefined {
  const idx = process.argv.indexOf("--sample");
  return idx !== -1 ? parseInt(process.argv[idx + 1] || "3", 10) : undefined;
}

async function main() {
  const limit = parseSampleArg();

  // 1. Load data
  let leads = parseLeadsCSV(CSV_PATH);
  console.log(`📂 ${leads.length} leads loaded from CSV`);

  if (limit) {
    leads = leads.slice(0, limit);
    console.log(`   Sample mode: first ${limit}`);
  }

  // 2. Initialize storage
  const repo = new LeadRepository(DB_PATH);
  const existingHashes = repo.getExistingHashes();
  console.log(`🗄️  ${existingHashes.size} already processed`);

  // 3. Initialize provider
  const provider = createProvider(resolveProviderConfig());
  console.log(`🤖 Provider: ${provider.providerName}/${provider.modelName}`);

  // 4. Extract & persist incrementally
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const lead of leads) {
    const hash = hashTranscript(lead.transcripcion);

    if (existingHashes.has(hash)) {
      skipped++;
      continue;
    }

    try {
      const result = await withRetry(
        () => extractLead(provider, lead),
        { maxRetries: 5, label: lead.nombre }
      );
      repo.insert(result);
      existingHashes.add(hash);
      processed++;
      console.log(`   [${skipped + processed + failed}/${leads.length}] ✅ ${lead.nombre}`);
    } catch (err: unknown) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   [${skipped + processed + failed}/${leads.length}] ❌ ${lead.nombre}: ${msg.slice(0, 120)}`);
    }
  }

  // 5. Report
  repo.close();
  console.log(`\n✅ Done! Processed: ${processed} | Cached: ${skipped} | Failed: ${failed}`);
  console.log(`   Total in DB: ${skipped + processed}`);

  if (failed > 0) {
    console.log(`💡 Run again to retry failed leads.`);
  }
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
