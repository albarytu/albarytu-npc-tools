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
    return candidates;
}

async function findCandidateTable(candidateTableName) {
    if (!candidateTableName) {
        return null;
    }
    // search world first.
    var table = game.tables.find(t => t.name.toLowerCase() === candidateTableName.toLowerCase());
    if (table) {
        // console.log("Found world table for: ", candidateTableName);
        return table;
    }
    // search compendium tables next.
    for (const pack of game.packs) {
        if (pack.documentName !== "RollTable") {
            continue;
        }
        const index = await pack.getIndex();
        const entry = index.find(e => e.name.toLowerCase() === candidateTableName.toLowerCase());
        if (entry) {
            const table = await pack.getDocument(entry._id);
            // console.log("Found compendium table for: ", candidateTableName, " in pack: ", pack.collection);
            return table;
        }        
    }
    return null;
}

async function findMatchingTable(candidateTraits, suffix) {
    if (!candidateTraits || candidateTraits.length === 0) {
        return null;
    }
    // look for a relevant table in the order of specificity: actor template, ancestry-language combo, ancestry only
    for (const candidate of candidateTraits) {
        const tname = candidate + (suffix ? "::" + suffix : "");
        // console.log("Searching for names roll table: ", tname);
        var table = await findCandidateTable(tname);
        if (table) {
            // console.log("Found names roll table for: ", tname);
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