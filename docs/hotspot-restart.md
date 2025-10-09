                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         # Hotspot Restart Guide

Follow these steps after a reboot to bring the concurrent AP/STA hotspot back online.

- **Step 1 – Recreate the AP virtual interface**
  ```bash
  sudo iw dev wlp111s0 interface add wlp111s0_ap type __ap
  ```

- **Step 2 – (Optional) Restore the AP MAC address**
  ```bash
  sudo ip link set wlp111s0_ap address 48:89:e7:17:c5:2f
  ```

- **Step 3 – Assign the hotspot gateway IP**
  ```bash
  sudo ip addr add 10.42.0.1/24 dev wlp111s0_ap
  ```

- **Step 4 – Bring the AP interface up**
  ```bash
  sudo ip link set wlp111s0_ap up
  ```

- **Step 5 – Load nftables NAT rules**
  ```bash
  sudo nft -f /etc/nftables.conf
  ```

- **Step 6 – Start the access point service**
  ```bash
  sudo systemctl restart hostapd@wlp111s0_ap
  ```

- **Step 7 – Start the DHCP/NAT helper**
  ```bash
  sudo systemctl restart dnsmasq
  ```

- **Step 8 – Verify status (optional but recommended)**
  ```bash
  systemctl status hostapd@wlp111s0_ap
  systemctl status dnsmasq
  sudo nft list ruleset | sed -n '1,20p'
  ```
