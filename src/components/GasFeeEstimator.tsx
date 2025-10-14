import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface GasFeeEstimatorProps {
  provider: ethers.Provider | null;
  to: string;
  value: string;
  data?: string;
  onGasUpdate: (gasLimit: string, gasPrice: string) => void;
}

interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  estimatedCost: bigint;
  estimatedCostETH: string;
}

const GasFeeEstimator: React.FC<GasFeeEstimatorProps> = ({
  provider,
  to,
  value,
  data = '0x',
  onGasUpdate
}) => {
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [customGasLimit, setCustomGasLimit] = useState('');
  const [customGasPrice, setCustomGasPrice] = useState('');
  const [useCustomGas, setUseCustomGas] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (provider && to && ethers.isAddress(to)) {
      estimateGas();
    }
  }, [provider, to, value, data]);

  useEffect(() => {
    if (gasEstimate) {
      const gasLimit = useCustomGas && customGasLimit ? customGasLimit : gasEstimate.gasLimit.toString();
      const gasPrice = useCustomGas && customGasPrice ? ethers.parseUnits(customGasPrice, 'gwei').toString() : gasEstimate.gasPrice.toString();
      onGasUpdate(gasLimit, gasPrice);
    }
  }, [gasEstimate, useCustomGas, customGasLimit, customGasPrice, onGasUpdate]);

  const estimateGas = async () => {
    if (!provider) return;

    setIsLoading(true);
    setError('');

    try {
      const tx = {
        to,
        value: value ? ethers.parseEther(value) : 0n,
        data
      };

      const [gasLimit, feeData] = await Promise.all([
        provider.estimateGas(tx),
        provider.getFeeData()
      ]);

      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      const estimatedCost = gasLimit * gasPrice;
      const estimatedCostETH = ethers.formatEther(estimatedCost);

      const estimate: GasEstimate = {
        gasLimit,
        gasPrice,
        estimatedCost,
        estimatedCostETH
      };

      setGasEstimate(estimate);
      setCustomGasLimit(gasLimit.toString());
      setCustomGasPrice(ethers.formatUnits(gasPrice, 'gwei'));
    } catch (err) {
      console.error('Gas estimation failed:', err);
      setError('Failed to estimate gas fees');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomGasLimitChange = (value: string) => {
    setCustomGasLimit(value);
    if (gasEstimate && value) {
      const newCost = BigInt(value) * gasEstimate.gasPrice;
      setGasEstimate({
        ...gasEstimate,
        gasLimit: BigInt(value),
        estimatedCost: newCost,
        estimatedCostETH: ethers.formatEther(newCost)
      });
    }
  };

  const handleCustomGasPriceChange = (value: string) => {
    setCustomGasPrice(value);
    if (gasEstimate && value) {
      const newGasPrice = ethers.parseUnits(value, 'gwei');
      const newCost = gasEstimate.gasLimit * newGasPrice;
      setGasEstimate({
        ...gasEstimate,
        gasPrice: newGasPrice,
        estimatedCost: newCost,
        estimatedCostETH: ethers.formatEther(newCost)
      });
    }
  };

  if (isLoading) {
    return (
      <div className="gas-estimator">
        <div className="gas-estimator-header">
          <h4>Gas Fee Estimation</h4>
        </div>
        <div className="loading">Estimating gas fees...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gas-estimator">
        <div className="gas-estimator-header">
          <h4>Gas Fee Estimation</h4>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!gasEstimate) {
    return null;
  }

  return (
    <div className="gas-estimator">
      <div className="gas-estimator-header">
        <h4>Gas Fee Estimation</h4>
        <button
          type="button"
          className="refresh-button"
          onClick={estimateGas}
          title="Refresh gas estimate"
        >
          🔄
        </button>
      </div>

      <div className="gas-summary">
        <div className="gas-info">
          <span className="label">Estimated Cost:</span>
          <span className="value">{gasEstimate.estimatedCostETH} ETH</span>
        </div>
        <div className="gas-info">
          <span className="label">Gas Limit:</span>
          <span className="value">{gasEstimate.gasLimit.toString()}</span>
        </div>
        <div className="gas-info">
          <span className="label">Gas Price:</span>
          <span className="value">{ethers.formatUnits(gasEstimate.gasPrice, 'gwei')} Gwei</span>
        </div>
      </div>

      <div className="custom-gas-toggle">
        <label>
          <input
            type="checkbox"
            checked={useCustomGas}
            onChange={(e) => setUseCustomGas(e.target.checked)}
          />
          Use custom gas settings
        </label>
      </div>

      {useCustomGas && (
        <div className="custom-gas-inputs">
          <div className="form-group">
            <label htmlFor="customGasLimit">Gas Limit</label>
            <input
              id="customGasLimit"
              type="number"
              value={customGasLimit}
              onChange={(e) => handleCustomGasLimitChange(e.target.value)}
              placeholder="21000"
            />
          </div>
          <div className="form-group">
            <label htmlFor="customGasPrice">Gas Price (Gwei)</label>
            <input
              id="customGasPrice"
              type="number"
              step="0.1"
              value={customGasPrice}
              onChange={(e) => handleCustomGasPriceChange(e.target.value)}
              placeholder="20"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GasFeeEstimator;