const fs = require('fs');
const path = require('path');
const { query } = require('./database');

function dumpToSql() {
  const schemaFile = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaFile, 'utf8');

  let output = `-- Bếp Việt Gourmet SQL Dump\n-- Generated on: ${new Date().toISOString()}\n\n`;
  output += schema + '\n\n';

  // Dump Categories
  const categories = query('SELECT * FROM categories');
  for (const c of categories) {
    output += `INSERT INTO categories (id, name, slug, icon, display_order) VALUES (${c.id}, '${c.name.replace(/'/g, "''")}', '${c.slug}', '${c.icon}', ${c.display_order});\n`;
  }
  output += '\n';

  // Dump Foods
  const foods = query('SELECT * FROM foods');
  for (const f of foods) {
    output += `INSERT INTO foods (id, category_id, name, description, price, original_price, image, is_available, rating, prep_time, spicy_level, is_featured, sales_count) VALUES (${f.id}, ${f.category_id}, '${f.name.replace(/'/g, "''")}', '${(f.description || '').replace(/'/g, "''")}', ${f.price}, ${f.original_price || 'NULL'}, '${f.image}', ${f.is_available}, ${f.rating}, ${f.prep_time}, ${f.spicy_level}, ${f.is_featured}, ${f.sales_count});\n`;
  }
  output += '\n';

  const dumpPath = path.join(__dirname, 'full_backup.sql');
  fs.writeFileSync(dumpPath, output, 'utf8');
  console.log(`✅ Exported standard SQL dump to: ${dumpPath}`);
}

dumpToSql();
