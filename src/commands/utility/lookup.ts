/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import {
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/index.js";
import {
	baseContainer,
	errorContainer,
	Separator,
	TextDisplay,
} from "../../utils/components.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("lookup")
		.setDescription("lookup related commands")
		.addSubcommand((sub) =>
			sub
				.setName("domain")
				.setDescription("look up DNS records for a domain")
				.addStringOption((opt) =>
					opt
						.setName("domain")
						.setDescription("the domain")
						.setRequired(true),
				)
				.addStringOption((opt) =>
					opt
						.setName("type")
						.setDescription("record type")
						.addChoices(
							{ name: "A", value: "A" },
							{ name: "AAAA", value: "AAAA" },
							{ name: "MX", value: "MX" },
							{ name: "TXT", value: "TXT" },
							{ name: "NS", value: "NS" },
							{ name: "CNAME", value: "CNAME" },
						),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName("ip")
				.setDescription("look up an IP address")
				.addStringOption((opt) =>
					opt
						.setName("ip")
						.setDescription("the IP address")
						.setRequired(true),
				),
		)
		.setIntegrationTypes(
			ApplicationIntegrationType.UserInstall,
			ApplicationIntegrationType.GuildInstall,
		)
		.setContexts(
			InteractionContextType.Guild,
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
		),
	execute: async (interaction) => {
		const subcommand = interaction.options.getSubcommand(true);

		if (subcommand === "domain") {
			let domain = interaction.options.getString("domain", true);
			const type = interaction.options.getString("type") ?? "A";

			const domainPattern =
				/^(https?:\/\/)?(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})+$/;
			if (!domainPattern.test(domain)) {
				await interaction.editReply({
					components: [
						errorContainer("That doesn't look like a valid domain."),
					],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			try {
				if (domain.startsWith("https://")) {
					domain = domain.slice(8);
				}
				if (domain.startsWith("http://")) {
					domain = domain.slice(7);
				}
				const res = await fetch(
					`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
				);
				const data = (await res.json()) as {
					Status: number;
					Answer?: {
						name: string;
						type: number;
						TTL: number;
						data: string;
					}[];
				};

				if (data.Status !== 0 || !data.Answer || data.Answer.length === 0) {
					await interaction.editReply({
						components: [
							errorContainer(
								`No ${type} records found for \`${domain}\`.`,
							),
						],
						flags: MessageFlags.IsComponentsV2,
					});
					return;
				}

				const records = data.Answer.map(
					(r) => `\`${r.data}\` (TTL: ${r.TTL}s)`,
				).join("\n");

				const container = baseContainer()
					.addTextDisplayComponents(
						TextDisplay(`### DNS Lookup: ${domain}`),
					)
					.addSeparatorComponents(Separator())
					.addTextDisplayComponents(TextDisplay(`** ${type} Records **`))
					.addTextDisplayComponents(
						TextDisplay(`>>> ${records.slice(0, 1024)}`),
					);

				await interaction.editReply({
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			} catch {
				await interaction.editReply({
					components: [errorContainer("Failed to resolve DNS records.")],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		}

		if (subcommand === "ip") {
			const ip = interaction.options.getString("ip", true);
			const ipPattern =
				/^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

			if (!ipPattern.test(ip)) {
				await interaction.editReply({
					components: [
						errorContainer(
							"That doesn't look like a valid IPv4 address.",
						),
					],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			try {
				const res = await fetch(
					`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
				);
				const data = (await res.json()) as {
					status: string;
					message?: string;
					country?: string;
					regionName?: string;
					city?: string;
					zip?: string;
					lat?: number;
					lon?: number;
					timezone?: string;
					isp?: string;
					org?: string;
					as?: string;
					query: string;
				};

				if (data.status !== "success") {
					await interaction.editReply({
						components: [
							errorContainer(
								data.message ?? "Could not resolve that IP.",
							),
						],
						flags: MessageFlags.IsComponentsV2,
					});
					return;
				}
				const container = baseContainer()
					.addTextDisplayComponents(
						TextDisplay(`### IP Lookup: ${data.query}`),
					)
					.addSeparatorComponents(Separator())
					.addTextDisplayComponents(TextDisplay(`** IP Information **`))
					.addTextDisplayComponents(
						TextDisplay(`>>> **Country:**: ${data.country ?? "Unknown"}`),
					)
					.addTextDisplayComponents(
						TextDisplay(
							`>>> **Region:**: ${data.regionName ?? "Unknown"}`,
						),
					)
					.addTextDisplayComponents(
						TextDisplay(`>>> **City:**: ${data.city ?? "Unknown"}`),
					)
					.addTextDisplayComponents(
						TextDisplay(
							`>>> **Timezone:**: ${data.timezone ?? "Unknown"}`,
						),
					)
					.addTextDisplayComponents(
						TextDisplay(`>>> **ISP:**: ${data.isp ?? "Unknown"}`),
					)
					.addTextDisplayComponents(
						TextDisplay(`>>> **ASN:**: ${data.as ?? "Unknown"}`),
					);

				await interaction.editReply({
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			} catch {
				await interaction.editReply({
					components: [
						errorContainer("Failed to look up that IP address."),
					],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		}
	},
};

export default command;
