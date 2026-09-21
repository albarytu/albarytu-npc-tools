async function getTokenCandidateTraits(token, templateName) {
    var candidates = [];
    if (!token) {
        return candidates;
    }
    const ancestries = token.actor.system.traits.value;
    const languages = token.actor.system.details.languages.value;
    // most specific: actor template
    candidates.push(templateName);
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

async function buildNameForToken(token, templateName) {
    if (!token) {
        return null;
    }
    var tables = await getTokenCandidateTraits(token, templateName);
    const newName = await rollRandomName(tables);
    if (newName) {
        return newName + " (" + templateName + ")";
    }
    return null;
}

async function isUniqueName(name) {
    if (!name) {
        return true;
    }
    // check if any token in the scene has this name
    for (const token of canvas.tokens.placeables) {
        if (token.name === name) {
            return false;
        }
    }
    // check if any actor in the world has this name
    for (const actor of game.actors) {
        if (actor.name === name) {
            return false;
        }
    }
    return true;
}

async function buildUniqueNameForToken(token, templateName) {
    if (!token) {
        return null;
    }
    for (let i = 0; i < 10; i++) {
        const newName = await buildNameForToken(token, templateName);
        if (!newName || newName === templateName) {
            // we couldn't create a new name - exit early
            break;
        }
        // check if the new name is unique
        if (await isUniqueName(newName)) {
            return newName;
        }
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

    let templateName = token.actor.getFlag("albarytu-npc-tools", "originalActorName");
    if (!templateName) {
        templateName = token.actor.name;
    }
    const newName = await buildUniqueNameForToken(token, templateName);
    if (newName && newName !== templateName) {
        console.log("Assigning name: ", newName);
        await token.document.update({name: newName});
        await token.actor.update({name: newName});
        await token.actor.setFlag("albarytu-npc-tools", "originalActorName", templateName);
    }
    await token.actor.setFlag("albarytu-npc-tools", "generated", true);
}



Hooks.on("createToken", async(tokenDocument) => {
    const token = tokenDocument.object;
    await assignRandomName(token);
});

Hooks.on("renderTokenHUD", (hud, html) => {
    if (!game.user.isGM) return;
    if (hud.object.document.actorLink) return; // only show for unlinked tokens
    const rightCol = html.querySelector(".col.right");
    if (!rightCol) return;
    const button = document.createElement("div");
    button.classList.add("control-icon");
    button.innerHTML = `<i class="fas fa-dice"></i>`;
    button.addEventListener("click", async (event) => {
        const token = canvas.tokens.controlled[0];
        await assignRandomName(token);
    });
    rightCol.appendChild(button);
});

