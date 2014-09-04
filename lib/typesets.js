
/* 
 * These are jbinary typesets (file structures) used to read keepass
 */

var header = new jBinary.Template(
	{
		fieldId: ['enum', 'uint8', 
			['EndOfHeader','Comment','CipherID','CompressionFlags','MasterSeed','TransformSeed','TransformRounds','EncryptionIV','ProtectedStreamKey','StreamStartBytes','InnerRandomStreamID']],
		size: ['uint16'],
		
	}
);

var keepass2 = new jBinary.Template(
	{
		sig1: ['const', 'uint32', '0x9AA2D903', true],
		sig2: ['const', 'uint32', '0xB54BFB67', true],
		version: ['uint32'],
		
		
	}
	
);
