async function getTokenCandidateTraits(token) {
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

async function findMatchingTable(candidateTraits, suffix) {
    if (!candidateTraits || candidateTraits.length === 0) {
        return null;
    }
    const folder = game.folders.find(f => f.type === "RollTable" && f.name === "albarytu-npc-names");
    if (!folder) {
        ui.notifications.warn("RollTable Folder 'albarytu-npc-names' not found.");
        return null;
    }
    for (const candidate of candidateTraits) {
        const tname = candidate + (suffix ? "-" + suffix : "");
        var table = game.tables.find(t => t.folder?.id === folder.id && t.name.toLowerCase() === tname.toLowerCase());
        if (table) {
            console.log("Found names roll table for: ", tname);
            return table;
        }
    }
    return null;
}

async function rollComponent(candidateTraits, suffix) {
    const table = await findMatchingTable(candidateTraits, suffix);
    if (!table) {
        return null;
    }
    const result = await table.draw({displayChat: false});
    if (result.results.length > 0) {
        return result.results[0].name;
    }
    return null;
}

async function rollRandomName(candidateTraits) {
    const title= await rollComponent(candidateTraits, "title");
    const first= await rollComponent(candidateTraits, "first");
    const last= await rollComponent(candidateTraits, "last");
    const name = [title, first, last].filter(Boolean).join(" ");
    if (name) {
        return name;
    }    
    return null;
}

async function buildNameForToken(token, originalName) {
    if (!token) {
        return null;
    }
    var tables = await getTokenCandidateTraits(token);
    const newName = await rollRandomName(tables);
    if (newName) {
        return newName + " (" + originalName + ")";
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
    const newName = await buildNameForToken(token, originalName);
    console.log("new name generated: ", newName);
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