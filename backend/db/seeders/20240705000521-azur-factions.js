'use strict';

/** @type {import('sequelize-cli').Migration} */

let options = {};
options.tableName = "Groups";
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; // define your schema in options object
}

const { User } = require('../models');

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    const EagleUnionLeader = await User.findOne({
      where: { email: "grey.ghost@azurL.io" }
    });
    const RoyalNavyLeader = await User.findOne({
      where: { email: "queen.elizabeth@azurL.io" }
    });
    const SakuraEmpireLeader = await User.findOne({
      where: { email: "nagato.sakura@azurL.io" }
    });
    const IronBloodLeader = await User.findOne({
      where: { email: "bismarck.ironblood@azurL.io" }
    });
    const DragonEmperyLeader = await User.findOne({
      where: { email: "yat.sen@azurL.io" }
    });
    const SardegnaEmpireLeader = await User.findOne({
      where: { email: "vittorio.veneto@azurL.io" }
    });
    const VichyaDominionLeader = await User.findOne({
      where: { email: "jean.bart@azurL.io" }
    });
    const IrisLibreLeader = await User.findOne({
      where: { email: "richelieu.libre@azurL.io" }
    });
    const NorthernParliamentLeader = await User.findOne({
      where: { email: "sovetsky.soyuz@azurL.io" }
    });
    const SirenLeader = await User.findOne({
      where: { email: "observer.alpha@azurL.io" }
    });

    await queryInterface.bulkInsert(options, [
      {
        organizerId: EagleUnionLeader.id,
        name: "Eagle Union",
        about: "In the world of Azur Lane, the Eagle Union, a beacon of freedom and innovation, stands as one of the mightiest naval forces in the Azur Lane world. Embracing the spirit of democracy and liberty, the Eagle Union shipgirls are renowned for their advanced technology, strategic prowess, and unyielding resolve. Led by iconic figures such as Enterprise, they epitomize the strength and resilience of their homeland. The Eagle Union's fleet is a harmonious blend of power and precision, ready to defend the seas and ensure peace across the globe.",
        type: "In person",
        private: false,
        city: "Norfolk",
        state: "VA"
      },
      {
        organizerId: RoyalNavyLeader.id,
        name: "Royal Navy",
        about: "In the world of Azur Lane, the Royal Navy stands as a paragon of tradition, honor, and maritime supremacy. With a history steeped in valor and a legacy that spans centuries, the Royal Navy shipgirls embody the dignity and strength of their illustrious heritage. Guided by the wise and regal Queen Elizabeth, the Royal Navy's fleet is a formidable force, balancing elegance with firepower. Their mission is to uphold the principles of justice and protect the seas from all threats, drawing on their rich traditions and unparalleled seamanship.",
        type: "In person",
        private: false,
        city: "Portsmouth",
        state: "Hants"
      },
      {
        organizerId: SakuraEmpireLeader.id,
        name: "Sakura Empire",
        about: "In the world of Azur Lane, the Sakura Empire is a realm of honor, tradition, and formidable naval power. Drawing inspiration from the storied history of the Imperial Japanese Navy, the Sakura Empire shipgirls are known for their discipline, elegance, and deadly precision in battle. Led by the cunning and strategic minds of Akagi and Kaga, the Sakura Empire's fleet combines ancient samurai principles with modern naval warfare tactics. Their mission is to restore and maintain the glory of their homeland, guided by a deep sense of duty and an unbreakable spirit.",
        type: "In person",
        private: false,
        city: "Yokosuka",
        state: "Kanagawa"
      },
      {
        organizerId: IronBloodLeader.id,
        name: "Iron Blood",
        about: "In the world of Azur Lane, Iron Blood stands as a testament to innovation, discipline, and formidable might. Drawing from the proud legacy of the German Kriegsmarine, the Iron Blood shipgirls exemplify precision, strength, and a relentless pursuit of excellence. Under the command of the indomitable Bismarck, the Iron Blood fleet is a powerhouse of advanced technology and strategic brilliance. Their mission is to assert their dominance on the seas, driven by a blend of militaristic rigor and cutting-edge naval warfare tactics.",
        type: "In person",
        private: false,
        city: "Kiel",
        state: "SH"
      },
      {
        organizerId: DragonEmperyLeader.id,
        name: "Dragon Empery",
        about: "In the world of Azur Lane, the Dragon Empery embodies a rich tapestry of history, tradition, and unwavering resolve. Inspired by the Chinese Navy's legacy, the Dragon Empery shipgirls are characterized by their grace, strategic acumen, and deep cultural heritage. Led by the visionary Yat Sen, the Dragon Empery's fleet combines ancient wisdom with modern naval tactics to defend their sovereignty and uphold their values. Their mission is rooted in honor and unity, forging ahead with determination to protect their seas and preserve their ancient traditions.",
        type: "In person",
        private: false,
        city: "Shanghai",
        state: "Jiangsu"
      },
      {
        organizerId: SardegnaEmpireLeader.id,
        name: "Sardegna Empire",
        about: "In the world of Azur Lane, the Sardegna Empire stands as a bastion of elegance, strength, and cultural richness. Inspired by the Regia Marina of Italy, Sardegna Empire shipgirls embody the grace, sophistication, and naval prowess of their maritime heritage. Led by the illustrious Vittorio Veneto, the Sardegna Empire's fleet blends tradition with modern naval strategies to safeguard their sovereignty and uphold their cultural values. Their mission is rooted in a deep sense of pride and honor, defending their seas with a blend of tactical finesse and formidable firepower",
        type: "In person",
        private: false,
        city: "Taranto",
        state: "Apulia"
      },
      {
        organizerId: VichyaDominionLeader.id,
        name: "Vichya Dominion",
        about: "In the world of Azur Lane, the Vichya Dominion represents a unique blend of resilience, innovation, and cultural heritage. Inspired by the Vichy French Navy, Vichya Dominion shipgirls embody a spirit of determination, strategic brilliance, and adaptive warfare. Led by the steadfast Jean Bart, the Vichya Dominion's fleet integrates French naval traditions with modern tactics to defend their interests and pursue their goals. Their mission is defined by a commitment to independence and excellence, navigating the turbulent seas with courage and tactical finesse.",
        type: "In person",
        private: false,
        city: "Marseille",
        state: "PACA"
      },
      {
        organizerId: IrisLibreLeader.id,
        name: "Iris Libre",
        about: "In the world of Azur Lane, Iris Libre stands as a symbol of faith, valor, and a quest for liberation. Representing the Free French Navy, Iris Libre shipgirls are characterized by their devotion, courage, and unwavering spirit. Led by the revered Richelieu, the Iris Libre fleet combines a rich spiritual heritage with strategic brilliance to fight for freedom and justice. Their mission is deeply rooted in a sense of divine duty and patriotism, defending their ideals and ensuring peace on the seas.",
        type: "In person",
        private: false,
        city: "Toulon",
        state: "PACA"
      },
      {
        organizerId: NorthernParliamentLeader.id,
        name: "Northern Parliament",
        about: "In the world of Azur Lane, the Northern Parliament represents the fierce resilience, tenacity, and strategic ingenuity of the Soviet Navy. Embodying the spirit of endurance and strength, Northern Parliament shipgirls are known for their unyielding determination and powerful presence on the battlefield. Led by the formidable Sovetsky Soyuz, the Northern Parliament fleet combines raw firepower with tactical acumen to defend their homeland and uphold their ideals. Their mission is characterized by a relentless pursuit of victory and a deep sense of duty, navigating the icy waters with unwavering resolve.",
        type: "In person",
        private: false,
        city: "Murmansk",
        state: "Murmansk Oblast"
      },
      {
        organizerId: SirenLeader.id,
        name: "Siren",
        about: "In the world of Azur Lane, the Sirens are an enigmatic and powerful faction that operates from the shadows, manipulating events and challenging the various fleets with their advanced technology and mysterious motives. Known for their cold and calculating nature, the Siren shipgirls are embodiments of intrigue and danger, with their true origins and goals shrouded in secrecy. Led by the enigmatic Observer Alpha, the Sirens use their superior technology and strategic prowess to test and confront the shipgirls of Azur Lane, continually pushing the boundaries of their power and influence. Their mission is often obscure, filled with hidden agendas and a relentless pursuit of their unknown objectives.",
        type: "In person",
        private: true,
        city: "The Abyssal City",
        state: "The Abyss"
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     const Op = Sequelize.Op;
     await queryInterface.bulkDelete(options, {
        about: { [Op.startsWith]: 'In the world of Azur Lane,' }
     });
  }
};
