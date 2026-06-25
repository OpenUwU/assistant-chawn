/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import { MediaGalleryBuilder } from "discord.js";
import {
	ActionRow,
	baseContainer,
	Separator,
	secondaryButton,
	TextDisplay,
} from "./components.js";

export const BASE_URL =
	"https://raw.githubusercontent.com/bre4d777/anime-gifs/master";
// github.com/bre4d777/anime-gifs/tree/master/index.json
export const CATEGORIES: Record<string, number> = {
	airkiss: 6,
	angrystare: 32,
	bite: 20,
	bleh: 7,
	blush: 41,
	brofist: 9,
	celebrate: 7,
	cheers: 6,
	clap: 8,
	confused: 8,
	cool: 4,
	cry: 46,
	cuddle: 29,
	dance: 33,
	drool: 12,
	evillaugh: 10,
	facepalm: 5,
	handhold: 10,
	happy: 15,
	headbang: 8,
	hug: 40,
	huh: 6,
	kiss: 36,
	laugh: 17,
	lick: 14,
	love: 9,
	mad: 25,
	nervous: 18,
	no: 8,
	nom: 46,
	nosebleed: 5,
	nuzzle: 10,
	nyah: 8,
	pat: 27,
	peek: 6,
	pinch: 11,
	poke: 17,
	pout: 29,
	punch: 15,
	roll: 7,
	run: 26,
	sad: 5,
	scared: 43,
	shout: 9,
	shrug: 3,
	shy: 17,
	sigh: 8,
	sing: 19,
	sip: 12,
	slap: 25,
	sleep: 34,
	slowclap: 3,
	smack: 18,
	smile: 20,
	smug: 21,
	sneeze: 4,
	sorry: 4,
	stare: 20,
	stop: 9,
	surprised: 19,
	sweat: 4,
	thumbsup: 6,
	tickle: 9,
	tired: 15,
	wave: 22,
	wink: 32,
	woah: 8,
	yawn: 10,
	yay: 10,
	yes: 9,
};

export const ACTION_STRINGS: Record<string, { solo: string; at: string }> = {
	airkiss: {
		solo: "blows a kiss into the air",
		at: "blows a kiss at {target}",
	},
	angrystare: {
		solo: "stares angrily at nothing",
		at: "stares daggers at {target}",
	},
	bite: { solo: "bites the air", at: "bites {target}" },
	bleh: {
		solo: "sticks their tongue out",
		at: "sticks their tongue out at {target}",
	},
	blush: { solo: "is blushing", at: "blushes at {target}" },
	brofist: { solo: "throws out a brofist", at: "brofists {target}" },
	celebrate: { solo: "is celebrating", at: "celebrates with {target}" },
	cheers: { solo: "raises a glass", at: "cheers with {target}" },
	clap: { solo: "claps", at: "claps for {target}" },
	confused: { solo: "is confused", at: "is confused by {target}" },
	cool: { solo: "is looking cool", at: "acts cool in front of {target}" },
	cry: { solo: "is crying", at: "cries because of {target}" },
	cuddle: { solo: "cuddles up alone", at: "cuddles {target}" },
	dance: { solo: "is dancing", at: "dances with {target}" },
	drool: { solo: "is drooling", at: "drools over {target}" },
	evillaugh: { solo: "laughs evilly", at: "laughs evilly at {target}" },
	facepalm: { solo: "facepalms", at: "facepalms at {target}" },
	handhold: { solo: "reaches out for a hand", at: "holds {target}'s hand" },
	happy: { solo: "is happy", at: "is happy to see {target}" },
	headbang: { solo: "is headbanging", at: "headbangs with {target}" },
	hug: { solo: "wants a hug", at: "hugs {target}" },
	huh: { solo: "goes huh?", at: "goes huh? at {target}" },
	kiss: { solo: "blows a kiss", at: "kisses {target}" },
	laugh: { solo: "is laughing", at: "laughs at {target}" },
	lick: { solo: "licks their lips", at: "licks {target}" },
	love: { solo: "is feeling loved", at: "loves {target}" },
	mad: { solo: "is mad", at: "is mad at {target}" },
	nervous: { solo: "is nervous", at: "is nervous around {target}" },
	no: { solo: "says no", at: "says no to {target}" },
	nom: { solo: "is nomming", at: "noms {target}" },
	nosebleed: {
		solo: "gets a nosebleed",
		at: "gets a nosebleed because of {target}",
	},
	nuzzle: { solo: "nuzzles into nothing", at: "nuzzles {target}" },
	nyah: { solo: "goes nyah~", at: "goes nyah~ at {target}" },
	pat: { solo: "pats the air", at: "pats {target} on the head" },
	peek: { solo: "peeks around", at: "peeks at {target}" },
	pinch: { solo: "pinches the air", at: "pinches {target}" },
	poke: { solo: "pokes the air", at: "pokes {target}" },
	pout: { solo: "is pouting", at: "pouts at {target}" },
	punch: { solo: "throws a punch", at: "punches {target}" },
	roll: { solo: "rolls around", at: "rolls their eyes at {target}" },
	run: { solo: "is running", at: "runs away from {target}" },
	sad: { solo: "is sad", at: "is sad because of {target}" },
	scared: { solo: "is scared", at: "is scared of {target}" },
	shout: { solo: "shouts into the void", at: "shouts at {target}" },
	shrug: { solo: "shrugs", at: "shrugs at {target}" },
	shy: { solo: "is being shy", at: "gets shy around {target}" },
	sigh: { solo: "sighs deeply", at: "sighs at {target}" },
	sing: { solo: "is singing", at: "serenades {target}" },
	sip: { solo: "takes a sip", at: "sips tea while staring at {target}" },
	slap: { solo: "slaps the air", at: "slaps {target}" },
	sleep: { solo: "is sleeping", at: "falls asleep on {target}" },
	slowclap: { solo: "slow claps", at: "slow claps for {target}" },
	smack: { solo: "smacks the air", at: "smacks {target}" },
	smile: { solo: "is smiling", at: "smiles at {target}" },
	smug: { solo: "is being smug", at: "looks smugly at {target}" },
	sneeze: { solo: "sneezes", at: "sneezes on {target}" },
	sorry: { solo: "is apologizing", at: "apologizes to {target}" },
	stare: { solo: "stares into the void", at: "stares at {target}" },
	stop: { solo: "says stop", at: "tells {target} to stop" },
	surprised: { solo: "is surprised", at: "is surprised by {target}" },
	sweat: { solo: "is sweating nervously", at: "sweats nervously at {target}" },
	thumbsup: { solo: "gives a thumbs up", at: "gives {target} a thumbs up" },
	tickle: { solo: "tickles the air", at: "tickles {target}" },
	tired: { solo: "is tired", at: "is tired of {target}" },
	wave: { solo: "waves", at: "waves at {target}" },
	wink: { solo: "winks", at: "winks at {target}" },
	woah: { solo: "goes woah", at: "goes woah at {target}" },
	yawn: { solo: "yawns", at: "yawns in {target}'s face" },
	yay: { solo: "goes yay", at: "goes yay for {target}" },
	yes: { solo: "says yes", at: "says yes to {target}" },
};

export const allCategoryKeys = Object.keys(CATEGORIES);

export function randomNum(category: string, exclude?: number): number {
	const count = CATEGORIES[category];
	let num: number;
	do {
		num = Math.floor(Math.random() * count) + 1;
	} while (count > 1 && num === exclude);
	return num;
}

export function buildContainer(
	text: string,
	action: string,
	num: number,
	disabled = false,
) {
	return baseContainer()
		.addTextDisplayComponents(TextDisplay(text))
		.addSeparatorComponents(Separator())
		.addMediaGalleryComponents(
			new MediaGalleryBuilder().addItems((media) =>
				media.setURL(`${BASE_URL}/${action}/${num}.gif`),
			),
		)
		.addSeparatorComponents(Separator())
		.addActionRowComponents(
			ActionRow().addComponents(
				secondaryButton("Reroll gif", "reroll", disabled),
			),
		);
}
