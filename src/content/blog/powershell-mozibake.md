---
title: PowerShellで、chcp 65001しても文字化けする
summary: PSReadLineが悪い？
published: 2026-09-29
tags: [powershell, gcc]
---

## 問題

出力のエンコーディングをUTF-8にしたかったがうまくいかなかった：

C言語の日本語を含むファイルをUTF-8で保存し、gccで特にオプションをつけずにコンパイルした。これをWindows ターミナル上のPowerShellやVSCode上のPowerShellで実行すると文字化けした。
検索すると`chcp 65001`でターミナルをUTF-8にするという情報がヒットしたが、これでもうまくいかなかった。

## 原因

Claude Codeに調べてもらったところによると、PowerShellモジュールのPSReadLineが悪さをしている可能性がある。こいつは行を読み取るたびに出力側のエンコーディングを932（Shift-JISのCP932）に戻してしまうようだ。実際、`chcp 65001; .\hoge.exe`のように入力を挟まずに実行すると文字化けしなかった。

調査用のコマンド（Claude作、コメントは実行結果）

```powershell
Add-Type -Namespace Win32 -Name Con -MemberDefinition @'
[DllImport("kernel32.dll")] public static extern uint GetConsoleCP();
[DllImport("kernel32.dll")] public static extern uint GetConsoleOutputCP();
'@
function Show-CP { "Input: {0} / Output: {1}" -f [Win32.Con]::GetConsoleCP(), [Win32.Con]::GetConsoleOutputCP() }

chcp 65001 > $null; Show-CP # Input: 65001 / Output: 65001
Show-CP                     # Input: 65001 / Output: 932

Remove-Module PSReadLine

chcp 65001 > $null
Show-CP                     # Input: 65001 / Output: 65001
```

## どうするか

### chcpと同時に実行する

先述の通り`chcp 65001; .\hoge.exe`のように入力を挟まなければ文字化けしない。

### 別のコマンドを使う

`[Console]::OutputEncoding = [Text.Encoding]::UTF8`なら同じセッション中は戻らない

### gccに-fexec-charset=cp932オプションを付ける

UTF-8からShift-JISにコンパイルする。最初からShift-JISにすれば問題なし

### PowerShellを使わない

cmdならPSReadLineがいないので、普通に`chcp`すればおｋ。またはwsl上でビルド・実行をすれば、wslの出力エンコーディングがUTF-8なので問題は起きない。
