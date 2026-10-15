import db from './db.js';

console.log('\n=================== 📊 POMOFOCUS DATABASE EXPLORER ===================\n');

// 1. Fetch Users
console.log('--- 👤 USERS TABLE ---');
const users = db.prepare('SELECT id, name, email, created_at FROM users').all();
if (users.length === 0) {
  console.log('(No users registered yet)');
} else {
  console.table(users);
}

// 2. Fetch User Data
console.log('\n--- 📁 USER DATA (TASKS, TEMPLATES & SETTINGS) ---');
const rows = db.prepare(`
  SELECT 
    ud.user_id, 
    u.name, 
    u.email, 
    ud.pomodoro_count,
    ud.tasks_json, 
    ud.templates_json,
    ud.updated_at
  FROM user_data ud
  LEFT JOIN users u ON u.id = ud.user_id
`).all();

if (rows.length === 0) {
  console.log('(No synced data yet)');
} else {
  rows.forEach((r) => {
    let tasks = [];
    let templates = [];
    try {
      tasks = JSON.parse(r.tasks_json || '[]');
      templates = JSON.parse(r.templates_json || '[]');
    } catch (e) {}

    console.log(`\nUser: ${r.name} (${r.email}) [ID: ${r.user_id}]`);
    console.log(`Pomodoros completed: ${r.pomodoro_count}`);
    console.log(`Tasks stored (${tasks.length}):`, tasks.map(t => `${t.title} (${t.actPomodoros}/${t.estPomodoros}🍅)`));
    console.log(`Templates/Work Groups (${templates.length}):`, templates.map(tpl => tpl.name));
    console.log(`Last Synced At: ${r.updated_at}`);
  });
}

console.log('\n=====================================================================\n');

