const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const codeHelper = require('../Helpers/codeHelper'); // Adjust the path as necessary

const router = express.Router();

router.post('/run', (req, res) => {
    const code = req.body.code; // The code to be executed
    const input = req.body.input; // The input data for the code
    const id = req.body.id; // Unique identifier for the execution context
    const lang = req.body.lang; // Programming language

    const sourceExt = {
        'cpp': '.cpp',
        'java': '.java',
        'python': '.py',
    };

    const command = {
        'cpp': `g++ Main.cpp -o out && ./out < input.txt`,
        'java': `javac Main.java && java Main < input.txt`,
        'python': `python3 Main.py < input.txt`, // Use python3 for macOS
    };

    // Create a directory for the execution context
    codeHelper.createDir(id);

    // Create the main source file
    codeHelper.createFile(path.join(__dirname, `../${id}/Main`), sourceExt[lang], code);
    
    // Create the input file
    codeHelper.createFile(path.join(__dirname, `../${id}/input`), '.txt', input);

    // Save the code to the respective language file
    fs.writeFileSync(path.join(__dirname, `../${id}/Main${sourceExt[lang]}`), code, 'utf8');

    // Execute the code
    exec(command[lang], { cwd: path.join(__dirname, `../${id}`) }, (error, stdout, stderr) => {
        // Clean up: Delete the code file and directory after execution
        fs.unlinkSync(path.join(__dirname, `../${id}/Main${sourceExt[lang]}`));
        fs.unlinkSync(path.join(__dirname, `../${id}/input.txt`)); // Clean up input file
        codeHelper.removeDir(id);

        if (error) {
            console.error(`Execution error: ${error.message}`);
            return res.status(500).json({ error: 'Execution error' });
        } else if (stderr) {
            console.error(`Standard error: ${stderr}`);
            return res.status(400).json({ error: stderr });
        } else {
            return res.json({ output: stdout }); // Send the output back to the frontend
        }
    });
});

module.exports = router;
