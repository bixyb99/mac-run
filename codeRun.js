const router = require('express').Router();
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const codeHelper = require('../Helpers/codeHelper');

router.post('/run', (req, res) => {
    let code = req.body.code;
    let input = req.body.input;
    let id = req.body.id;
    let lang = req.body.lang;

    const sourceExt = {
        'cpp': '.cpp',
        'java': '.java',
        'python': '.py',
    }

    const command = {
        'cpp': `cd ${id} && g++ Main.cpp -o out && ./out < input.txt`,
        'java': `cd ${id} && javac Main.java && java Main < input.txt`,
        'python': `cd ${id} && python3 Main.py < input.txt`, // Use python3 for macOS
    }

    // Create directory and files
    codeHelper.createDir(id);
    codeHelper.createFile(path.join(__dirname, `../${id}/Main`), sourceExt[lang], code);
    codeHelper.createFile(path.join(__dirname, `../${id}/input`), '.txt', input);

    // Save the code to respective language file
    fs.writeFileSync(path.join(__dirname, `../${id}/Main${sourceExt[lang]}`), code, 'utf8');

    exec(command[lang], { cwd: path.join(__dirname, `../${id}`) }, (error, stdout, stderr) => {
        // Delete the code file after execution
        fs.unlinkSync(path.join(__dirname, `../${id}/Main${sourceExt[lang]}`));
        codeHelper.removeDir(id);

        if (error) {
            console.error(`Execution error: ${error.message}`);
            res.status(500).json({ error: 'Execution error' });
        } else if (stderr) {
            console.error(`Standard error: ${stderr}`);
            res.status(400).json({ error: stderr });
        } else {
            res.send(stdout);
        }
    });
});

module.exports = router;
