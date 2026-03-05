const fs = require('fs');
const path = require('path');

const dashboardDir = path.join(__dirname, 'src', 'app', 'dashboard');
const mobileDir = path.join(dashboardDir, 'mobile');
const desktopBkpDir = path.join(__dirname, 'src', 'app', 'dashboard-desktop-backup');

if (!fs.existsSync(desktopBkpDir)) {
    fs.mkdirSync(desktopBkpDir, { recursive: true });
}

// 1. Move old desktop files to backup (except 'mobile', 'components', 'styleguide', 'migrate', etc.)
const dirsToBackup = fs.existsSync(dashboardDir) ? fs.readdirSync(dashboardDir).filter(f => 
    f !== 'mobile' && f !== 'components' && f !== 'styleguide' && f !== 'migrate' && f !== 'job-actions.tsx'
) : [];

dirsToBackup.forEach(item => {
    const srcPath = path.join(dashboardDir, item);
    const destPath = path.join(desktopBkpDir, item);
    if (fs.existsSync(srcPath)) {
        try {
            fs.renameSync(srcPath, destPath);
            console.log(`Backed up: ${item}`);
        } catch (e) {
            console.error(`Could not backup ${item}:`, e.message);
        }
    }
});

// 2. Move mobile files to dashboard
if (fs.existsSync(mobileDir)) {
    const mobileFiles = fs.readdirSync(mobileDir);
    mobileFiles.forEach(item => {
        const srcPath = path.join(mobileDir, item);
        const destPath = path.join(dashboardDir, item);
        
        if (fs.existsSync(destPath)) {
            console.log(`Conflict/Merge needed for: ${item}`);
            if (fs.statSync(srcPath).isDirectory() && fs.statSync(destPath).isDirectory()) {
                const subItems = fs.readdirSync(srcPath);
                subItems.forEach(sub => {
                    fs.renameSync(path.join(srcPath, sub), path.join(destPath, sub));
                });
                fs.rmdirSync(srcPath);
            } else {
                console.log(`Cannot move ${item} because it exists! OVERWRITING...`);
                fs.rmSync(destPath, { recursive: true, force: true });
                fs.renameSync(srcPath, destPath);
            }
        } else {
            fs.renameSync(srcPath, destPath);
        }
    });

    try {
        fs.rmdirSync(mobileDir);
        console.log('Mobile dir removed.');
    } catch(e) {
        console.log('Mobile dir not empty or error', e);
    }
}

// 3. Update relative imports in all .tsx files inside dashboard
function updateImports(filePath) {
    if (!fs.existsSync(filePath)) return;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
        const files = fs.readdirSync(filePath);
        files.forEach(f => updateImports(path.join(filePath, f)));
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        const newContent = content.replace(/(from\s+['"])([^'"]+)(['"])/g, (match, prefix, importPath, suffix) => {
            if (importPath.startsWith('.')) {
                let newImportPath = importPath;
                
                // Only replace dependencies pointing to "components". 
                // Before they were in `mobile` and used `../components` to reach `dashboard/components`.
                // Now they are in `dashboard` and must use `./components`.
                // `../../components` becomes `../components`
                // etc.
                
                if (newImportPath.startsWith('../../')) {
                    newImportPath = newImportPath.replace('../../', '../');
                } else if (newImportPath.startsWith('../')) {
                    newImportPath = newImportPath.replace('../', './');
                    newImportPath = newImportPath.replace(/^\.\/\.\//, './');
                }

                if (newImportPath !== importPath) {
                    modified = true;
                    return prefix + newImportPath + suffix;
                }
            }
            return match;
        });

        if (modified) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated imports in: ${filePath}`);
        }
    }
}

updateImports(dashboardDir);
console.log('Migration complete!');
