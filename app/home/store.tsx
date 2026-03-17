// phase 2
{/*
<BottomSheetScrollView style={{
    flex: 1, 
    marginBottom: 100, 
    backgroundColor: Colors[colorScheme ?? "light"].bgDark
}} 
stickyHeaderIndices={[0]}
>
    <View style={{
        width: windowWidth,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors[colorScheme ?? "light"].bgDark
    }}>
        <View style={{width: "100%", alignItems: "center"}}>
            <Text style={defaultStyles.title}>Your jurni ride</Text>
            <Text style={defaultStyles.subtitle}>Here's a quick summary.</Text>
        </View>
    </View>
    <View>
        <View style={{
            ...defaultStyles.mediumCard, 
            marginTop: 14, 
            marginBottom: 20, 
            marginHorizontal: 20, 
            paddingVertical: 10,
        }}
        >
            <View style={{flex: 1}}>
                <View style={{
                    width: "100%", 
                    alignItems: "center",
                }}
                >
                    <Text style={{
                        ...defaultStyles.title, 
                        fontSize: 18,
                    }}
                    >
                        {rideSummaryData[0].name}
                    </Text>
                </View>
                <View style={{
                    width: "100%", 
                    alignItems: "center",
                }}
                >
                    <Text style={{
                        ...defaultStyles.title, 
                        fontSize: 36, 
                        color: Colors[colorScheme ?? "light"].textMuted
                    }}
                    >
                        {rideSummaryData[0].value}
                    </Text>
                </View>
            </View>
        </View>
    </View>
    <View style={{
        ...defaultStyles.mediumCard, 
        marginHorizontal: 20, 
        padding: 12,
    }}
    >
        <View style={{
            width: "100%", 
            alignItems: "center",
            marginVertical: 5,
        }}
        >
            <Text style={{
                ...defaultStyles.title, 
                fontSize: 18,
            }}
            >
                Details
            </Text>
        </View>
        {rideSummaryData.map((item) => {
            if (item.name == "Price") {
                return (
                    <View key={item.name}></View>
                )
            }
            return (
                <View key={item.name} style={{paddingVertical: 15}}>
                    <View style={{
                        flex: 1, 
                        flexDirection: "row",
                    }}
                    >
                        <View style={{
                            flex: 1, 
                            justifyContent: "center",
                        }}
                        >
                            <Text style={{
                                ...defaultStyles.title, 
                                fontSize: 14,
                            }}
                            >
                                {item.name}
                            </Text>
                        </View>
                        <View style={{
                            flex: 1, 
                            alignItems: "flex-end", 
                            justifyContent: "center",
                        }}
                        >
                            <Text style={{
                                ...defaultStyles.subtitle, 
                                fontSize: 14,
                                textAlign:"right"
                            }}
                            >
                                {item.value}
                            </Text>
                        </View>
                    </View>
                </View>
            )
        })}
    </View>
    <View style={{height: 100, }}></View>
</BottomSheetScrollView>
*/}

{/*
<BottomSheetFooter {...props}>
    <View style={{
        width: "100%", 
        paddingHorizontal: 20, 
        backgroundColor: Colors[colorScheme ?? "light"].bgDark, 
        paddingBottom: 40, 
        gap: 10,}}>
        <Btn onPress={() => {
            setPhase(3);
            bottomSheetRef.current?.snapToIndex(0);
        }} text="Request ride"/>
        <Btn onPress={() => {setPhase(1)}} styleTxt={{color: Colors[colorScheme ?? "light"].primary,}} styleBtn={{
            borderWidth: 1,
            borderColor: Colors[colorScheme ?? "light"].primary,
            backgroundColor: Colors[colorScheme ?? "light"].bgDark,
        }} text="Return"/>
    </View>
</BottomSheetFooter>
*/}

// phase 3
{/* 
<BottomSheetView style={{
    height: windowHeight-265, 
    width: "100%", 
    backgroundColor: Colors[colorScheme ?? "light"].bgDark
}}
>
    <View style={{
        height: 390, 
        width: "100%", 
        justifyContent: "center", 
        alignItems: "center"
    }}
    >
        <View style={{
            height: 300, 
            width: 300, 
            backgroundColor: Colors[colorScheme ?? "light"].bg, 
            justifyContent: "center", 
            alignItems: "center", 
            borderRadius: 50,
        }}
        >
            <FontAwesomeIcon 
                icon={faCar} 
                size={100} 
                color={Colors[colorScheme ?? "light"].primary} 
            />
            <Text style={{
                ...defaultStyles.title, 
                fontSize: 16, 
                color: Colors[colorScheme ?? "light"].textMuted, 
                marginTop: 30,
            }}
            >
                Finding a ride...
            </Text>
        </View>
    </View>
    <View style={{
        height: windowHeight-265-390, 
        width: "100%", 
        justifyContent: "center", 
        alignItems: "center", 
        paddingHorizontal: 20,
    }}
    >
        <Text style={{
            ...defaultStyles.title, 
            fontSize: 14
        }}
        >
            Did you know?
        </Text>
        <Text style={{
            ...defaultStyles.subtitle, 
            fontSize: 12, 
            textAlign: "center",
            paddingHorizontal: 50, 
            marginTop: 5,
        }}
        >
            jurni's logo is made up of the location icon and the capital letter J
        </Text>
        <Text></Text>
    </View>
</BottomSheetView>
*/}

{/* 
<BottomSheetFooter {...props}>
    <View style={{width: "100%", paddingHorizontal: 20, backgroundColor: Colors[colorScheme ?? "light"].bgDark, paddingBottom: 40,}}>
        <Btn onPress={() => {
            setPhase(0);
        }} text={"Cancel"}/>
    </View>
</BottomSheetFooter>    
*/}