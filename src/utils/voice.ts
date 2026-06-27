/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */
import {
	ChannelType,
	type Guild,
	type GuildMember,
	PermissionsBitField,
	type VoiceBasedChannel,
} from "discord.js";

export function getMemberVoiceChannel(
	member: GuildMember,
): VoiceBasedChannel | null {
	return member.voice.channel;
}

export function getBotVoiceChannel(guild: Guild): VoiceBasedChannel | null {
	return guild.members.me?.voice.channel ?? null;
}

export function isSameVoice(member: GuildMember): boolean {
	const memberChannel = getMemberVoiceChannel(member);
	const botChannel = getBotVoiceChannel(member.guild);

	if (!memberChannel || !botChannel) return false;
	return memberChannel.id === botChannel.id;
}

export function canBotConnect(channel: VoiceBasedChannel): boolean {
	const me = channel.guild.members.me;
	if (!me) return false;
	return channel.permissionsFor(me)?.has(PermissionsBitField.Flags.Connect);
}
export function canBotSpeak(channel: VoiceBasedChannel): boolean {
	const me = channel.guild.members.me;
	if (!me) return false;

	const permissions = channel.permissionsFor(me);
	if (!permissions) return false;

	if (!permissions.has(PermissionsBitField.Flags.Connect)) return false;

	if (channel.type === ChannelType.GuildStageVoice) {
		if (me.voice.channelId === channel.id && !me.voice.suppress) {
			return true;
		}
		return (
			permissions.has(PermissionsBitField.Flags.MuteMembers) ||
			permissions.has(PermissionsBitField.Flags.Administrator)
		);
	}

	return permissions.has(PermissionsBitField.Flags.Speak);
}

export async function unsuppressIfNeeded(
	channel: VoiceBasedChannel,
): Promise<boolean> {
	const me = channel.guild.members.me;
	if (!me) return false;

	if (channel.type !== ChannelType.GuildStageVoice) return true;

	if (me.voice.channelId !== channel.id) return false;

	if (!me.voice.suppress) return true; // already speaking

	const permissions = channel.permissionsFor(me);
	if (!permissions) return false;

	const canBecomeSpeaker =
		permissions.has(PermissionsBitField.Flags.MuteMembers) ||
		permissions.has(PermissionsBitField.Flags.Administrator);
	if (!canBecomeSpeaker) return false;

	try {
		await me.voice.setSuppressed(false);
		return true;
	} catch {
		return false;
	}
}
