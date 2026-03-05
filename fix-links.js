const fs = require('fs');
const path = require('path');

function replaceLinkPaths(dir) {
    if(!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for(const item of items) {
        const fullPath = path.join(dir, item);
        if(fs.statSync(fullPath).isDirectory()) {
            replaceLinkPaths(fullPath);
        } else if(fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if(content.includes('/dashboard/mobile')) {
                const newContent = content.replace(/\/dashboard\/mobile/g, '/dashboard');
                fs.writeFileSync(fullPath, newContent);
                console.log('Fixed links in:', fullPath);
            }
        }
    }
}
replaceLinkPaths(path.join(__dirname, 'src', 'app', 'dashboard'));
console.log('Done replacement');
