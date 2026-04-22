const fs = require('fs')
const path = require('path')
const filePath = path.join(__dirname, '..', 'lib', 'dummy-accounts.ts')
let src = fs.readFileSync(filePath, 'utf8')

const map = [
  ["    followers: '12.4K',\n    following: '342',",  12400, 342],
  ["    followers: '843',\n    following: '1.2K',",   843,   1200],
  ["    followers: '31.2K',\n    following: '209',",  31200, 209],
  ["    followers: '2.1K',\n    following: '876',",   2100,  876],
  ["    followers: '8.7K',\n    following: '512',",   8700,  512],
  ["    followers: '4.3K',\n    following: '2.1K',",  4300,  2100],
  ["    followers: '54.1K',\n    following: '891',",  54100, 891],
  ["    followers: '19.8K',\n    following: '431',",  19800, 431],
  ["    followers: '87.3K',\n    following: '1.1K',", 87300, 1100],
  ["    followers: '1.6K',\n    following: '923',",   1600,  923],
  ["    followers: '967',\n    following: '1.4K',",   967,   1400],
  ["    followers: '3.8K',\n    following: '1.7K',",  3800,  1700],
  ["    followers: '512',\n    following: '678',",    512,   678],
  ["    followers: '6.2K',\n    following: '318',",   6200,  318],
  ["    followers: '22.0K',\n    following: '743',",  22000, 743],
]

let replaced = 0
for (const [pattern, fc, fgc] of map) {
  if (src.includes(pattern)) {
    const parts = pattern.split('\n')
    const replacement =
      parts[0] + '\n    followersCount: ' + fc + ',\n' +
      parts[1] + '\n    followingCount: ' + fgc + ','
    src = src.replace(pattern, replacement)
    replaced++
  }
}

fs.writeFileSync(filePath, src, 'utf8')
const fc = (src.match(/followersCount/g) || []).length
console.log('Replaced:', replaced, '| followersCount occurrences:', fc)
