async function getCandidateTables(token) {
    var candidates = [];
    if (!token) {
        return candidates;
    }
    const actorName = token.actor.name;
    const ancestries = token.actor.system.traits.value;
    const languages = token.actor.system.details.languages.value;
    // most specific: actor template
    candidates.push(actorName);
    // ancestry-language combo
    for (const ancestry of ancestries) {
        for (const language of languages) {
            candidates.push(ancestry + "-" + language);
        }
    }
    // ancestry only
    for (const ancestry of ancestries) {
        candidates.push(ancestry);
    }
    // language only
    for (const language of languages) {
        candidates.push(language);
    }
    return candidates;
}

async function findMatchingTable(candidates, folder) {
    if (!candidates || candidates.length === 0 || !folder) {
        return null;
    }
    for (const candidate of candidates) {
        var table = game.tables.find(t => t.folder?.id === folder.id && t.name.toLowerCase() === candidate.toLowerCase());
        if (table) {
            console.log("Found names roll table for: ", candidate);
            return table;
        }
    }
    return null;
}

async function findRandomNameForToken(token, originalName) {
    if (!token) {
        return null;
    }
    const folder = game.folders.find(f => f.type === "RollTable" && f.name === "albarytu-npc-names");
    if (!folder) {
        ui.notifications.warn("RollTable Folder 'albarytu-npc-names' not found.");
        return null;
    }
    var tables = await getCandidateTables(token);
    var table = await findMatchingTable(tables, folder);
    if (!table) {
        console.log("No matching table found for token: ", token.name);
        console.log("Candidate tables: ", tables);
        return null;
    }
    const result = await table.draw({displayChat: false});
    if (result.results.length > 0) {
        const name = result.results[0].name + " (" + token.actor.name + ")";
        ui.notifications.info("Assigned random name: " + name);
        return name;
    }
    return null;
}

async function assignRandomName(token) {
    if (!token) {
        return;
    }
    if (token.name !== token.actor.name || token.document.actorLink) {
        console.log("Token is an unique actor or already has a custom name.");
        return;
    }
    const originalName = token.actor.name;
    const newName = await findRandomNameForToken(token, originalName);
    if (newName && newName !== originalName) {
        console.log("Assigning name: ", newName);
        await token.document.update({name: newName});
        token.actor.update({name: newName});
    }
}

Hooks.on("createToken", async(tokenDocument) => {
    const token = tokenDocument.object;
    await assignRandomName(token);
});