function getRotationPrecomputeL(precompute_L, rotationMatrix) {
	// column-major, R*V
	let result = [];

	// row-major, V*R
	rotationMatrix = mat4Matrix2mathMatrix(rotationMatrix);

	const rotationMatrix_3by3 = computeSquareMatrix_3by3(rotationMatrix);
	const rotationMatrix_5by5 = computeSquareMatrix_5by5(rotationMatrix);

	result[0] = precompute_L[0];

	// (P^T * R)^T ==> R^T * P
	// precompute_L: 3 colors, 3 cols, 9 rows
	// precompute_L[i] represent (red[i], green[i], blue[i])
	// so, red[1:4] will be precompute_L[1][0], precompute_L[2][0], precompute_L[3][0]
	// for the sake of fewer codes, uses transpose and compute RGB in a single matrix
	const rotatedLevel1 = math.multiply(math.transpose(rotationMatrix_3by3), math.matrix([
		precompute_L[1],
		precompute_L[2],
		precompute_L[3],
	])).toArray();
	for (let j = 0; j < 3; ++j) {
		result[1 + j] = rotatedLevel1[j];
	}

	// same as above
	const rotatedLevel2 = math.multiply(math.transpose(rotationMatrix_5by5), math.matrix([
		precompute_L[4],
		precompute_L[5],
		precompute_L[6],
		precompute_L[7],
		precompute_L[8],
	])).toArray();
	for (let j = 0; j < 5; ++j) {
		result[4 + j] = rotatedLevel2[j];
	}

	return result;
}

function computeSquareMatrix_3by3(rotationMatrix){ // 计算方阵SA(-1) 3*3 
	
	// 1、pick ni - {ni}
	let n1 = [1, 0, 0, 0]; let n2 = [0, 0, 1, 0]; let n3 = [0, 1, 0, 0];

	// 2、{P(ni)} - A  A_inverse
	const P_n1 = SHEval(n1[0], n1[1], n1[2], 3);
	const P_n2 = SHEval(n2[0], n2[1], n2[2], 3);
	const P_n3 = SHEval(n3[0], n3[1], n3[2], 3);
	const A = math.matrix([P_n1.slice(1, 4), P_n2.slice(1, 4), P_n3.slice(1, 4)]);
	const A_inverse = math.inv(A);

	// 3、用 R 旋转 ni - {R(ni)}
	const R_n1 = math.multiply(n1, rotationMatrix).toArray();
	const R_n2 = math.multiply(n2, rotationMatrix).toArray();
	const R_n3 = math.multiply(n3, rotationMatrix).toArray();

	// 4、R(ni) SH投影 - S
	const P_R_n1 = SHEval(R_n1[0], R_n1[1], R_n1[2], 3);
	const P_R_n2 = SHEval(R_n2[0], R_n2[1], R_n2[2], 3);
	const P_R_n3 = SHEval(R_n3[0], R_n3[1], R_n3[2], 3);
	const S = math.matrix([P_R_n1.slice(1, 4), P_R_n2.slice(1, 4), P_R_n3.slice(1, 4)]);

	// 5、S*A_inverse
	return math.multiply(A_inverse, S);

}

function computeSquareMatrix_5by5(rotationMatrix){ // 计算方阵SA(-1) 5*5
	
	// 1、pick ni - {ni}
	let k = 1 / math.sqrt(2);
	let n1 = [1, 0, 0, 0]; let n2 = [0, 0, 1, 0]; let n3 = [k, k, 0, 0]; 
	let n4 = [k, 0, k, 0]; let n5 = [0, k, k, 0];

	// 2、{P(ni)} - A  A_inverse
	const P_n1 = SHEval(n1[0], n1[1], n1[2], 3);
	const P_n2 = SHEval(n2[0], n2[1], n2[2], 3);
	const P_n3 = SHEval(n3[0], n3[1], n3[2], 3);
	const P_n4 = SHEval(n4[0], n4[1], n4[2], 3);
	const P_n5 = SHEval(n5[0], n5[1], n5[2], 3);
	const A = math.matrix([
		P_n1.slice(4, 9),
		P_n2.slice(4, 9),
		P_n3.slice(4, 9),
		P_n4.slice(4, 9),
		P_n5.slice(4, 9),
	]);
	const A_inverse = math.inv(A);

	// 3、用 R 旋转 ni - {R(ni)}
	const R_n1 = math.multiply(n1, rotationMatrix).toArray();
	const R_n2 = math.multiply(n2, rotationMatrix).toArray();
	const R_n3 = math.multiply(n3, rotationMatrix).toArray();
	const R_n4 = math.multiply(n4, rotationMatrix).toArray();
	const R_n5 = math.multiply(n5, rotationMatrix).toArray();

	// 4、R(ni) SH投影 - S
	const P_R_n1 = SHEval(R_n1[0], R_n1[1], R_n1[2], 3);
	const P_R_n2 = SHEval(R_n2[0], R_n2[1], R_n2[2], 3);
	const P_R_n3 = SHEval(R_n3[0], R_n3[1], R_n3[2], 3);
	const P_R_n4 = SHEval(R_n4[0], R_n4[1], R_n4[2], 3);
	const P_R_n5 = SHEval(R_n5[0], R_n5[1], R_n5[2], 3);
	const S = math.matrix([
		P_R_n1.slice(4, 9),
		P_R_n2.slice(4, 9),
		P_R_n3.slice(4, 9),
		P_R_n4.slice(4, 9),
		P_R_n5.slice(4, 9),
	]);

	// 5、S*A_inverse
	return math.multiply(A_inverse, S);

}

function mat4Matrix2mathMatrix(rotationMatrix){

	let mathMatrix = [];
	for(let i = 0; i < 4; i++){
		let r = [];
		for(let j = 0; j < 4; j++){
			r.push(rotationMatrix[i*4+j]);
		}
		mathMatrix.push(r);
	}
	return math.transpose(math.matrix(mathMatrix));

}

function getMat3ValueFromRGB(precomputeL){

    let colorMat3 = [];
    for(var i = 0; i<3; i++){
        colorMat3[i] = mat3.fromValues( precomputeL[0][i], precomputeL[1][i], precomputeL[2][i],
										precomputeL[3][i], precomputeL[4][i], precomputeL[5][i],
										precomputeL[6][i], precomputeL[7][i], precomputeL[8][i] ); 
	}
    return colorMat3;
}