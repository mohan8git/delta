import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import axios from 'axios';
import 'antd/dist/reset.css';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [symbolArray, setSymbolArray] = useState([]);
  useEffect(() => {
    axios.get('https://api.delta.exchange/v2/products').then((res) => {
      setProducts(res.data.result);
      const symbolArray = res.data.result.map((item) => {
        return item.symbol;
      });
      setSymbolArray(symbolArray);
    });
  }, []);

  const socket = new WebSocket('wss://production-esocket.delta.exchange');

  socket.onopen = () => {
    const subscribeMessage = {
      type: 'subscribe',
      payload: {
        channels: [
          {
            name: 'v2/ticker',
            symbols: [...symbolArray],
          },
        ],
      },
    };
    socket.send(JSON.stringify(subscribeMessage));
  };

  setInterval(() => {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'v2/ticker') {
        const newProducts = products.map((item) => {
          if (item.symbol === data.symbol) {
            item.markPrice = data.mark_price;
          }
          return item;
        });
        setProducts(newProducts);
      }
    };
  }, 1000);

  const columns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      width: '25%',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '25%',
    },
    {
      title: 'Underlying Asset',
      dataIndex: ['underlying_asset', 'symbol'],
      key: ['underlying_asset', 'symbol'],
      width: '15%',
    },
    {
      title: 'Mark Price',
      dataIndex: 'markPrice',
      key: 'markPrice',
      render: (text, record) => {
        const currentPrice = record.markPrice;
        return <div>{currentPrice ? currentPrice : 'loading...'}</div>;
      },
    },
  ];

  return (
    <div className='main-container'>
      <div className='header'>
        <img
          src='https://www.delta.exchange/small-logo.svg'
          alt='logo'
          className='logo'
        />
        <div className='delta-button'>Delta Assigment</div>
      </div>
      <Table
        dataSource={products}
        columns={columns}
        pagination={{
          pageSize: 10,
        }}
        tableProps={{
          scroll: { x: 100 + 96, y: 700 },
        }}
      />
      ;
    </div>
  );
}

export default App;
