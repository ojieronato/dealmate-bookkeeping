# Upload and hand off to your CRM builder

## Upload the source

1. Extract the delivery ZIP. Open the inner `dealmate-bookkeeping` folder containing `README.md`, `INTEGRATE.md`, `package.json`, `src`, and `demo`.
2. Sign in to GitHub and visit https://github.com/new. Name the repository `dealmate-bookkeeping`. Choose Private to restrict source access, or Public if you intend anyone to read/download this code. Leave the generated README, .gitignore, and license options off; this package already contains the first two.
3. Click **Create repository**. On the empty repository page, choose **uploading an existing file**. If the repository already has a file, use **Add file → Upload files**.
4. Drag the contents of the inner folder into the upload area. Preserve folders, including `.github`, and include `.gitignore`. Upload the extracted source, not just the ZIP. `README.md` and `INTEGRATE.md` should appear at the repository's top level.
5. Commit with a message such as `Add DealMate bookkeeping v0.1.0`. Check that `src`, `test`, `demo`, `docs`, and the installation prompt are visible.
6. Copy the repository URL from your browser. It will look like `https://github.com/YOUR-ACCOUNT/dealmate-bookkeeping`.

GitHub documentation: [Create a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository) and [Upload files](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

Only upload the supplied source and fictional demo. Keep real financial exports and credentials out of the repository. Private repositories require the builder's authorized GitHub access; a URL alone does not grant access. GitHub hosts the source; uploading it does not install the plugin or run its demo.

## Paste into Claude or your CRM builder

Use a coding environment with access to both this repository and the CRM source. If it cannot download repositories, attach the source ZIP and the installation prompt directly.

> Install the DealMate bookkeeping plugin from https://github.com/ojieronato/dealmate-bookkeeping into this CRM. First read the repository's INTEGRATE.md and follow it as the installation brief. Download or clone the source and record the exact commit used. Reuse our CRM's existing UI components and styling. Keep finance code and storage isolated, preserve existing CRM files and behavior, and do not use the demo's localStorage for production. If connecting the plugin requires changing an existing file, finish the extension and provide the smallest unapplied registration patch for review. Include payroll and cashbook functionality. Run the supplied tests and relevant CRM checks. Report what is connected, what still needs configuration, and how to activate it. Do not deploy or migrate production data. Record the source repository, commit, installed paths, and host-specific adaptations so future updates can be applied safely.

`INTEGRATE.md` contains the detailed business rules and implementation contract. A short link handoff does not replace those instructions.

## Later updates

Yes, the integrated plugin can be edited. The repository is the reusable source; the CRM contains its installed implementation and any host-specific adaptations. Copying the source once does not create automatic updates. Use [UPDATING.md](docs/UPDATING.md) for subsequent changes.
