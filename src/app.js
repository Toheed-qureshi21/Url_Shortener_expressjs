import express from "express"
import {readFile, writeFile} from "fs/promises"
import crypto from "crypto"
import path  from "path";
const PORT = 3000;
const app = express();
app.use(express.static("css"));
app.use(express.urlencoded({extended:true}));

const DATA_FILE = path.join(import.meta.dirname,"data","links.json");

const loadLinks = async () => {
    try {
        const links = await readFile(DATA_FILE,"utf-8");
        return JSON.parse(links)
    } catch (error) {
        console.error(error);
        if (error.code==="ENOENT") {
            await writeFile(DATA_FILE,JSON.stringify({}));
            return;
        }
        throw error;
        
    }
}
const savelinks = async (links) => {
    await writeFile(DATA_FILE,JSON.stringify(links));
}

app.get("/",async(req,res)=>{
    try {
        const file = await readFile(path.join(import.meta.dirname,"Html","index.html"),"utf-8");
        const links = await loadLinks();
        const content = file.toString().replaceAll("{{shorten-urls}}",Object.entries(links).map(([shortUrl,url])=>{
         return   `<li><a href="/${shortUrl}">${req.hostname}/${shortUrl}</a><br>--->${url}</li>`
        }).join(""))
        res.send(content)
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal server error");
    }
})
app.post("/",async(req,res) => {
    try {
        const {url,short_url} = req.body;

        const finalShortUrl = short_url || crypto.randomBytes(4).toString("hex");
        const links = await loadLinks()
        if (!url) {
            return res.status(402).send("URL IS REQUIRED");
        }
        if (links[finalShortUrl]) {
            return res.status(400).send("Do not write existing url")
        }
        links[finalShortUrl] = url;
        await savelinks(links);
        return res.redirect("/");
        

    } catch (error) {
            console.log(error);
            return res.status(500).send("Internal server error");
            
        }    
    })
    app.get("/:shortUrl",async(req,res)=>{
        const {shortUrl} = req.params;
        const links = await loadLinks();
        if (links[shortUrl]) {
           return res.redirect(links[shortUrl])
        }
        else {
           return res.status(404).send("404,NOT found")
        }
    })

app.listen(PORT,()=>{
    console.log(`Server is Running on http://localhost:${PORT}`);
    
})