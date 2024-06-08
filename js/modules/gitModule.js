const fs = require('fs');
const simpleGit = require('simple-git/promise');
const { notifyClients } = require('./websocket.js');
async function cloneGitRepository(gitProjectUrl, gitBranch, directoryPath, wss) {
    const git = simpleGit(directoryPath);
    try {
        if (await git.checkIsRepo()) {
            const currentRemoteUrl = (await git.listRemote(['--get-url'])).trim();
            if (currentRemoteUrl !== gitProjectUrl) {
                throw new Error('Existing git project in directory does not match the provided URL');
            }
            const currentBranch = (await git.revparse(['--abbrev-ref', 'HEAD'])).trim();
            if (currentBranch !== gitBranch) {
                await git.checkout(gitBranch);
            }
        } else if (fs.readdirSync(directoryPath).length !== 0) {
            throw new Error('Directory is not empty and does not contain a git project');
        } else {
            await git.clone(gitProjectUrl, directoryPath);
            await git.checkout(gitBranch);
        }
        notifyClients(wss, 'gitStatus', { message: `Cloned repository ${gitProjectUrl} to ${directoryPath}` });
        return true;
    } catch (error) {
        console.error(`Error cloning repository ${gitProjectUrl} to ${directoryPath}: ${error}`);
        notifyClients(wss, 'gitStatus', { message: `Error cloning repository ${gitProjectUrl} to ${directoryPath}` });
        return false;
    }
}

module.exports = {
    cloneGitRepository
};