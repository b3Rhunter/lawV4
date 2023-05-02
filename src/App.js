import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import ABI from './ABI.json';
import Notification from './Notification';

function App() {

  const [connected, setConnected] = useState(false);
  const [contract, setContract] = useState();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [pointsToDistribute, setPointsToDistribute] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [userAddress, setUserAddress] = useState('0x0000');
  const [pointBalance, setPointBalance] = useState(0);
  const [redeemable, setRedeemable] = useState(0)
  const [tokenBalance, setTokenBalance] = useState(0);
  const [userList, setUserList] = useState([]);
  const [userNameList, setUserNameList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setUser] = useState("select user")
  const [selectedUserName, setSelectedUserName] = useState('');
  const [distribute, setDistribute] = useState(false)
  const [redeem, setRedeem] = useState(false)
  const [join, setJoin] = useState(false)
  const [newUser, setNewUser] = useState('')
  const [notification, setNotification] = useState({ message: '', show: false });

  const handleClick = (newValue, newName) => {
    setRecipientAddress(newValue);
    setShowDropdown(false);
    setUser(newValue)
    setSelectedUserName(newName);
  };

  const showNotification = (message) => {
    setNotification({ message, show: true });
  };


  useEffect(() => {
    if (connected && contract) {
      fetchBalances();
    }
  }, [connected, contract]);

  const fetchUserList = async () => {
    try {
      const userCount = await contract.getUserCount();
      console.log("User count:", userCount.toString()); // Debugging statement 1

      let tempUserList = [];
      let tempUserNameList = [];
      for (let i = 0; i < userCount; i++) {
        const userAddress = await contract.userList(i);
        const userName = await contract.userNameList(i);

        console.log("User address:", userAddress); // Debugging statement 2
        console.log("User name:", userName); // Debugging statement 3

        tempUserList.push(userAddress);
        tempUserNameList.push(userName);
      }
      setUserList(tempUserList);
      setUserNameList(tempUserNameList);
    } catch (error) {
      console.error('Error fetching user list:', error);
    }
  };

  useEffect(() => {
    if (connected && contract) {
      fetchBalances();
      fetchUserList(); // Fetch user list and user name list
    }
  }, [connected, contract]);


  const fetchBalances = async () => {
    try {

      const tokenBal = await contract.balanceOf(userAddress);
      const points = await contract.getUserPoints(userAddress);
      const redeemablePoints = await contract.getUserReceivedPoints(userAddress);
      setPointBalance(points.toString());
      setRedeemable(redeemablePoints.toString())
      const tokenBalInEther = ethers.utils.formatEther(tokenBal);
      const wholeNumberTokenBal = Math.floor(parseFloat(tokenBalInEther));
      setTokenBalance(wholeNumberTokenBal.toString());

      console.log(ethers.utils.formatEther(tokenBal).toString())
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const connect = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner()
      const address = "0x4d95f6CaDCAee4A08f7971E38fe3dC601526a236"
      const getContract = new ethers.Contract(address, ABI, signer);
      setContract(getContract)
      const userAddr = await signer.getAddress();
      setUserAddress(userAddr);
      await signer.signMessage("Welcome Law-yers!");
      setConnected(true)
      showNotification("Welcome " + userAddr.substr(0, 6) + "...");
    } catch (error) {
      setConnected(false)
      showNotification(error.message)
    }
  }

  const joinPlatform = async (newUser) => {
    if (!contract) return;
    try {
      const tx = await contract.joinPlatform(newUser);
      await tx.wait();
      fetchBalances();
      showNotification("Successfully Joined!");
    } catch (error) {
      showNotification("Error Joining Platform: " + error.message);
    }
  };

  const createRewardPool = async () => {
    if (!contract) return;
    try {
      const amount = ethers.utils.parseUnits("100", 18);
      const tx = await contract.createRewardPool(amount);
      await tx.wait();
      fetchBalances();
      showNotification("Round Started!");
    } catch (error) {
      showNotification("Error:", error);
    }
  };

  const distributePoints = async () => {
    if (!contract) return;
    try {
      const tx = await contract.distributePoints(recipientAddress, pointsToDistribute);
      await tx.wait();
      fetchBalances();
      showNotification("Successfully distributed points!");
    } catch (error) {
      showNotification("Error:", error);
    }
  };

  const redeemPoints = async () => {
    if (!contract) return;
    try {
      const tx = await contract.redeemPoints(pointsToRedeem);
      await tx.wait();
      fetchBalances();
      showNotification("Successfully redeemed points!");
    } catch (error) {
      showNotification("Error:", error);
    }
  };

  function openDistribute() {
    setDistribute(true)
    setRedeem(false)
    setJoin(false)
  }

  function openRedeem() {
    setRedeem(true)
    setDistribute(false)
    setJoin(false)
  }

  function openJoin() {
    setJoin(true)
    setRedeem(false)
    setDistribute(false)
  }

  return (
    <div className="App">
      <header className="App-header">
        <button className='connect' onClick={connect}>
          {!connected && <p>connect</p>}
          {connected && <p>connected</p>}
        </button>
        <button className='join' onClick={openJoin}>Join Platform</button>
        <button className='start' onClick={createRewardPool}>Start Round</button>
        <button className='distribute' onClick={openDistribute}>Give Points</button>
        <button className='redeem' onClick={openRedeem}>Redeem Points</button>
        <Notification
          message={notification.message}
          show={notification.show}
          setShow={(show) => setNotification({ ...notification, show })}
        />
        <div className='user'>
          <h2>User Address: {userAddress.substr(0, 6) + "..."}</h2>
          <h2>Points: {pointBalance}</h2>
          <h2>Points to Redeem {redeemable}</h2>
          <h2>Token Balance: {tokenBalance}</h2>
        </div>

        <div>
          {join && (
            <div className='cont'>
              <input
                type="text"
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                placeholder="choose a user name"
              />
              <br />
              <button onClick={() => joinPlatform(newUser)}>Register</button>
            </div>
          )}
          {distribute && (
            <div className='cont'>
              <div className="custom-dropdown" onClick={() => setShowDropdown(!showDropdown)}>
                <button className="custom-dropdown-button">
                  {selectedUserName ? `${selectedUserName} - ${selectedUser.substr(0, 6)}...` : "Select User"}
                </button>
                {showDropdown && (
                  <div className="custom-dropdown-content">
                    {userList.map((userAddress, index) => (
                      <div
                        key={userAddress}
                        onClick={() => handleClick(userAddress, userNameList[index])}
                      >
                        {userNameList[index]} - {userAddress.substr(0, 6) + "..."}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <br />
              <input
                type="text"
                value={pointsToDistribute}
                onChange={(e) => setPointsToDistribute(e.target.value)}
                placeholder="Points to Distribute"
              />
              <br />
              <button onClick={distributePoints}>Distribute</button>
            </div>
          )}
          {redeem && (
            <div className='cont'>
              <input
                type="text"
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(e.target.value)}
                placeholder="Points to Redeem"
              />
              <br />
              <button onClick={redeemPoints}>Redeem</button>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
