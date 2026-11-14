# Installing tough2simple on a school server

For the person installing over SSH. The school's students and teachers then open the server's address in a browser on the school network. Nothing on their phones or laptops needs the internet.

## What you need

- A computer that stays on during school hours, on the school network, with at least 2 GB of free disk.
- **Node.js 24** on that computer (`node --version` should print `v24` or later).
- The package file `tough2simple-school-<version>.tar.gz`.
- A licence from tough2simple, or an enrolment code if the server has internet.

The package already contains everything else. Nothing is downloaded during the install.

## Linux (tested)

```sh
# 1. Unpack
sudo mkdir -p /opt/tough2simple /var/lib/tough2simple
sudo tar -xzf tough2simple-school-*.tar.gz -C /opt/tough2simple --strip-components=1

# 2. A user to run it as
sudo useradd --system --home /var/lib/tough2simple tough2simple
sudo chown -R tough2simple /var/lib/tough2simple

# 3. Start it now and at every boot
sudo cp /opt/tough2simple/tough2simple.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tough2simple
```

Open `http://<server address>:8080/licence`. It shows the server's **fingerprint** and that there is no licence yet.

## Licensing the server

**If the server has internet.** In the tough2simple console, make an enrolment code for the campus, then on the server:

```sh
cd /opt/tough2simple
sudo -u tough2simple DATA_DIR=/var/lib/tough2simple node dist/campus/cli.mjs enrol https://<console address> <code>
```

The licence arrives straight away. Afterwards the server checks in whenever it has a connection, which is how extensions reach it.

**If the server never has internet.** Send tough2simple the fingerprint from the `/licence` page. You get back a licence file made for that server. Open `/licence`, choose the file and press "Install licence", or on the server:

```sh
sudo -u tough2simple DATA_DIR=/var/lib/tough2simple node dist/campus/cli.mjs licence /path/to/file.t2s-licence
```

## Checking and looking after it

```sh
sudo -u tough2simple DATA_DIR=/var/lib/tough2simple node /opt/tough2simple/dist/campus/cli.mjs status
sudo journalctl -u tough2simple -n 50      # recent log lines
sudo systemctl restart tough2simple
```

- **Back up `/var/lib/tough2simple`.** It holds the licence, the server's identity and, later, the school's accounts and work.
- **Keep the clock right.** The licence dates use the server's clock. Turning the clock back does not extend a licence.
- **To update**, unpack the new package over `/opt/tough2simple` and restart. The data folder is not touched.
- To use port 80 so people do not type `:8080`, put the school's usual web server in front, or set `PORT=80` and give Node permission to use it.

## When a licence ends

The server becomes read-only for the read-only period on the licence (14 days unless agreed otherwise): everything can be read, nothing can be changed, and every page says so. After that it locks and every address shows the licence page. Installing an extended licence, or the next check-in after tough2simple extends it, opens it again. No data is deleted.

## Windows (not yet tested)

The server is the same Node program. Unpack the package, set `DATA_DIR` to a folder that is backed up, run `node dist\campus\server.mjs`, and register it as a service with the Windows Task Scheduler or NSSM so it starts at boot. This path has not been run on a real Windows server yet; treat the first install as a test.
