async function promoteTokenToActor(token) {
    // check that a token is selected
    if (!token) {
        ui.notifications.warn("No token selected.");
        return;
    }
    // if token is linked to an actor, it's not a generic - we shouldn't promote it
    if (token.document.actorLink) {
        ui.notifications.warn("Token is already linked to an actor.");
        return;
    }
    console.log("Promoting token \"" + token.name + "\" to actor...");
    const actorData = token.actor.toObject();
    // create the new actor
    delete actorData._id;
    actorData.name = token.actor.name;
    // update prototype token data to match the token's settings    
    actorData.prototypeToken.name = actorData.name;
    actorData.prototypeToken.actorLink = true;
    var wantedDisplayName = token.document.displayName;
    if (wantedDisplayName === CONST.TOKEN_DISPLAY_MODES.NONE) {
        wantedDisplayName = CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER;
    }
    actorData.prototypeToken.displayName = wantedDisplayName;
    const newActor = await Actor.create(actorData);
    // link the token to the new actor
    await token.document.update({actorId: newActor.id, actorLink: true, name: newActor.name});
    await token.document.update({displayName: wantedDisplayName});
    ui.notifications.info("Token promoted to actor \"" + newActor.name + "\".");
}

Hooks.on("renderTokenHUD", (hud, html) => {
    if (!game.user.isGM) return;
    if (hud.object.document.actorLink) return; // only show for unlinked tokens
    const rightCol = html.querySelector(".col.right");
    if (!rightCol) return;
    const button = document.createElement("div");
    button.classList.add("control-icon");
    button.innerHTML = `<i class="fas fa-user-plus"></i>`;
    button.addEventListener("click", async (event) => {
        const token = canvas.tokens.controlled[0];
        await promoteTokenToActor(token);
    });
    rightCol.appendChild(button);
});

